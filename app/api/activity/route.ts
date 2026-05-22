import { NextResponse } from "next/server";
import { QuoteStatus, ReminderStatus } from "@prisma/client";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ActivityEntityType = "prospect" | "quote" | "reminder";

type ActivityEvent = {
  id: string;
  type:
    | "prospect_created"
    | "quote_created"
    | "quote_sent"
    | "quote_accepted"
    | "quote_rejected"
    | "quote_cancelled"
    | "reminder_created"
    | "reminder_scheduled"
    | "reminder_sent"
    | "reminder_failed";
  title: string;
  description: string;
  date: Date;
  href?: string;
  entityType: ActivityEntityType;
  entityId: string;
};

function prospectLabel(prospect: {
  name: string;
  company: string | null;
}) {
  return prospect.company ? `${prospect.name} (${prospect.company})` : prospect.name;
}

function quoteLabel(quote: {
  title: string;
  quoteNumber: string | null;
}) {
  return quote.quoteNumber
    ? `${quote.title} #${quote.quoteNumber}`
    : quote.title;
}

function reminderDescription(reminder: {
  quote: {
    title: string;
    quoteNumber: string | null;
    prospect: {
      name: string;
      company: string | null;
    };
  };
}) {
  return `${quoteLabel(reminder.quote)} pour ${prospectLabel(
    reminder.quote.prospect
  )}`;
}

export async function GET() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const [prospects, quotes, reminders] = await Promise.all([
      prisma.prospect.findMany({
        where: { userId: dbUser.id },
        select: {
          id: true,
          name: true,
          company: true,
          createdAt: true,
        },
      }),

      prisma.quote.findMany({
        where: { prospect: { userId: dbUser.id } },
        select: {
          id: true,
          title: true,
          quoteNumber: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          sentAt: true,
          acceptedAt: true,
          rejectedAt: true,
          prospect: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
        },
      }),

      prisma.reminder.findMany({
        where: { quote: { prospect: { userId: dbUser.id } } },
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          scheduledAt: true,
          sentAt: true,
          quote: {
            select: {
              id: true,
              title: true,
              quoteNumber: true,
              prospect: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const events: ActivityEvent[] = [
      ...prospects.map((prospect) => ({
        id: `prospect_created:${prospect.id}`,
        type: "prospect_created" as const,
        title: "Prospect créé",
        description: prospectLabel(prospect),
        date: prospect.createdAt,
        href: `/prospects/${prospect.id}`,
        entityType: "prospect" as const,
        entityId: prospect.id,
      })),

      ...quotes.flatMap((quote) => {
        const description = `${quoteLabel(quote)} pour ${prospectLabel(
          quote.prospect
        )}`;
        const quoteEvents: ActivityEvent[] = [
          {
            id: `quote_created:${quote.id}`,
            type: "quote_created",
            title: "Devis créé",
            description,
            date: quote.createdAt,
            href: `/quotes/${quote.id}`,
            entityType: "quote",
            entityId: quote.id,
          },
        ];

        if (quote.sentAt) {
          quoteEvents.push({
            id: `quote_sent:${quote.id}`,
            type: "quote_sent",
            title: "Devis envoyé",
            description,
            date: quote.sentAt,
            href: `/quotes/${quote.id}`,
            entityType: "quote",
            entityId: quote.id,
          });
        }

        if (quote.acceptedAt) {
          quoteEvents.push({
            id: `quote_accepted:${quote.id}`,
            type: "quote_accepted",
            title: "Devis accepté",
            description,
            date: quote.acceptedAt,
            href: `/quotes/${quote.id}`,
            entityType: "quote",
            entityId: quote.id,
          });
        }

        if (quote.rejectedAt) {
          quoteEvents.push({
            id: `quote_rejected:${quote.id}`,
            type: "quote_rejected",
            title: "Devis refusé",
            description,
            date: quote.rejectedAt,
            href: `/quotes/${quote.id}`,
            entityType: "quote",
            entityId: quote.id,
          });
        }

        if (quote.status === QuoteStatus.CANCELLED) {
          quoteEvents.push({
            id: `quote_cancelled:${quote.id}`,
            type: "quote_cancelled",
            title: "Devis annulé",
            description,
            date: quote.updatedAt,
            href: `/quotes/${quote.id}`,
            entityType: "quote",
            entityId: quote.id,
          });
        }

        return quoteEvents;
      }),

      ...reminders.flatMap((reminder) => {
        const description = reminderDescription(reminder);
        const reminderEvents: ActivityEvent[] = [
          {
            id: `reminder_created:${reminder.id}`,
            type: "reminder_created",
            title: "Relance créée",
            description: `${reminder.subject} - ${description}`,
            date: reminder.createdAt,
            href: `/quotes/${reminder.quote.id}`,
            entityType: "reminder",
            entityId: reminder.id,
          },
        ];

        if (reminder.scheduledAt) {
          reminderEvents.push({
            id: `reminder_scheduled:${reminder.id}`,
            type: "reminder_scheduled",
            title: "Relance programmée",
            description: `${reminder.subject} - ${description}`,
            date: reminder.scheduledAt,
            href: `/quotes/${reminder.quote.id}`,
            entityType: "reminder",
            entityId: reminder.id,
          });
        }

        if (reminder.sentAt) {
          reminderEvents.push({
            id: `reminder_sent:${reminder.id}`,
            type: "reminder_sent",
            title: "Relance envoyée",
            description: `${reminder.subject} - ${description}`,
            date: reminder.sentAt,
            href: `/quotes/${reminder.quote.id}`,
            entityType: "reminder",
            entityId: reminder.id,
          });
        }

        if (reminder.status === ReminderStatus.FAILED) {
          reminderEvents.push({
            id: `reminder_failed:${reminder.id}`,
            type: "reminder_failed",
            title: "Relance en échec",
            description: `${reminder.subject} - ${description}`,
            date: reminder.updatedAt,
            href: `/quotes/${reminder.quote.id}`,
            entityType: "reminder",
            entityId: reminder.id,
          });
        }

        return reminderEvents;
      }),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json(events);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("ACTIVITY_LIST_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
