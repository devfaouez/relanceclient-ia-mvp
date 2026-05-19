import { NextRequest, NextResponse } from "next/server";
import { ReminderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getReminderEmailConfig,
  ReminderEmailConfigurationError,
  sendReminderEmail,
} from "@/lib/email/reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("SCHEDULED_REMINDERS_CRON_ERROR: CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    getReminderEmailConfig();
  } catch (error) {
    if (error instanceof ReminderEmailConfigurationError) {
      console.error(
        "SCHEDULED_REMINDERS_CRON_ERROR: Resend email configuration missing"
      );
      return NextResponse.json(
        { error: "Email configuration missing" },
        { status: 500 }
      );
    }

    throw error;
  }

  try {
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        status: ReminderStatus.SCHEDULED,
        scheduledAt: { lte: now },
        sentAt: null,
      },
      include: {
        quote: {
          include: {
            prospect: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 50,
    });

    const result = {
      processed: reminders.length,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const reminder of reminders) {
      if (!reminder.quote.prospect.email?.trim()) {
        result.skipped += 1;
        continue;
      }

      try {
        await sendReminderEmail(reminder, reminder.quote.prospect.userId);

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SENT, sentAt: new Date() },
        });

        result.sent += 1;
      } catch (error) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.FAILED },
        });

        result.failed += 1;
        console.error("SCHEDULED_REMINDER_SEND_ERROR:", {
          reminderId: reminder.id,
          error,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("SCHEDULED_REMINDERS_CRON_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
