import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { sendReminderSchema } from "@/lib/validations";
import { ReminderStatus } from "@prisma/client";

// TODO: Replace with authenticated user ID from Supabase session
const DEMO_USER_ID = "demo-user-id";

export async function POST(request: NextRequest) {
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
      quote: { prospect: { userId: DEMO_USER_ID } },
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

  if (!reminder.approvedAt) {
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

  const { error: sendError } = await resend.emails.send({
    // TODO: Set RESEND_FROM_EMAIL env var to a verified sender domain
    from: process.env.RESEND_FROM_EMAIL ?? "RelanceClient IA <onboarding@resend.dev>",
    to: prospectEmail,
    subject: reminder.subject,
    text: reminder.body,
  });

  if (sendError) {
    return NextResponse.json(
      { error: "Failed to send email", details: sendError },
      { status: 502 }
    );
  }

  const updated = await prisma.reminder.update({
    where: { id: reminder.id },
    data: { status: ReminderStatus.SENT, sentAt: new Date() },
  });

  return NextResponse.json(updated);
}
