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

const BATCH_SIZE = 50;
const MAX_BATCHES = 10;

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
    const result = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const reminders = await prisma.reminder.findMany({
        where: {
          status: ReminderStatus.SCHEDULED,
          scheduledAt: { lte: now },
          sentAt: null,
          approvedAt: { not: null },
        },
        include: {
          quote: {
            include: {
              prospect: true,
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: BATCH_SIZE,
      });

      if (reminders.length === 0) break;

      for (const reminder of reminders) {
        result.processed += 1;

        // Sans email, la relance ne pourra jamais partir : on la sort de la
        // file (FAILED) pour qu'elle ne bloque pas les suivantes. L'artisan
        // peut la renvoyer après avoir complété l'email du prospect.
        if (!reminder.quote.prospect.email?.trim()) {
          await prisma.reminder.updateMany({
            where: {
              id: reminder.id,
              status: ReminderStatus.SCHEDULED,
              sentAt: null,
            },
            data: { status: ReminderStatus.FAILED },
          });

          result.skipped += 1;
          console.warn("SCHEDULED_REMINDER_SKIPPED_NO_EMAIL:", {
            reminderId: reminder.id,
          });
          continue;
        }

        // Réservation atomique : seule l'exécution qui pose sentAt envoie
        // l'email, ce qui évite les doubles envois si deux crons se
        // chevauchent ou si la relance a été modifiée entre-temps.
        const claimedAt = new Date();
        const claim = await prisma.reminder.updateMany({
          where: {
            id: reminder.id,
            status: ReminderStatus.SCHEDULED,
            sentAt: null,
            approvedAt: { not: null },
          },
          data: { sentAt: claimedAt },
        });

        if (claim.count === 0) {
          result.skipped += 1;
          continue;
        }

        try {
          await sendReminderEmail(reminder, reminder.quote.prospect.userId);

          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: ReminderStatus.SENT, sentAt: claimedAt },
          });

          result.sent += 1;
        } catch (error) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: ReminderStatus.FAILED, sentAt: null },
          });

          result.failed += 1;
          console.error("SCHEDULED_REMINDER_SEND_ERROR:", {
            reminderId: reminder.id,
            error,
          });
        }
      }

      if (reminders.length < BATCH_SIZE) break;
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
