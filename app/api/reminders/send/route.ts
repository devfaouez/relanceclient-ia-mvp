import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { sendReminderSchema } from "@/lib/validations";
import { ReminderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = sendReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        id: parsed.data.reminderId,
        quote: { prospect: { userId: dbUser.id } },
      },
      include: {
        quote: { include: { prospect: true } },
      },
    });

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    if (reminder.status !== ReminderStatus.APPROVED) {
      return NextResponse.json(
        { error: "Reminder must be in APPROVED status before sending" },
        { status: 422 }
      );
    }

    if (!reminder.requiresHumanApproval) {
      return NextResponse.json(
        { error: "Reminder does not require human approval" },
        { status: 422 }
      );
    }

    if (!reminder.approvedAt || !reminder.approvedById) {
      return NextResponse.json(
        { error: "Reminder has not been approved yet" },
        { status: 422 }
      );
    }

    if (reminder.sentAt) {
      return NextResponse.json(
        { error: "Reminder has already been sent" },
        { status: 409 }
      );
    }

    const prospectEmail = reminder.quote.prospect.email;
    if (!prospectEmail) {
      return NextResponse.json(
        { error: "Prospect does not have an email address" },
        { status: 422 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM;
    if (!fromEmail) {
      console.error(
        "REMINDER_SEND_ERROR: RESEND_FROM_EMAIL/EMAIL_FROM not configured"
      );
      return NextResponse.json(
        { error: "Email sender not configured" },
        { status: 500 }
      );
    }

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: prospectEmail,
      subject: reminder.subject,
      text: reminder.body,
    });

    if (sendError) {
      // Marquer FAILED pour traçabilité
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: ReminderStatus.FAILED },
      });

      console.error("REMINDER_SEND_ERROR:", sendError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 502 }
      );
    }

    const updated = await prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: ReminderStatus.SENT, sentAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("REMINDER_SEND_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
