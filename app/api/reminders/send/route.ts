import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { sendReminderSchema } from "@/lib/validations";
import { ReminderStatus } from "@prisma/client";
import {
  ReminderEmailConfigurationError,
  sendReminderEmail,
} from "@/lib/email/reminders";

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

    const isRetry = reminder.status === ReminderStatus.FAILED;

    if (!isRetry && reminder.status !== ReminderStatus.APPROVED) {
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

    if (!isRetry && (!reminder.approvedAt || !reminder.approvedById)) {
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

    const prospectEmail = reminder.quote.prospect.email?.trim();
    if (!prospectEmail) {
      return NextResponse.json(
        {
          error:
            "Impossible d'envoyer la relance : le prospect n'a pas d'adresse email.",
        },
        { status: 422 }
      );
    }

    try {
      await sendReminderEmail(reminder, dbUser.id);
    } catch (error) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: ReminderStatus.FAILED },
      });

      if (error instanceof ReminderEmailConfigurationError) {
        console.error("REMINDER_SEND_ERROR: Resend email configuration missing");
        return NextResponse.json(
          { error: "Configuration Resend manquante" },
          { status: 500 }
        );
      }

      console.error("REMINDER_SEND_ERROR:", error);
      return NextResponse.json(
        {
          error:
            "Erreur Resend lors de l'envoi de la relance. La relance reste en échec.",
        },
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
