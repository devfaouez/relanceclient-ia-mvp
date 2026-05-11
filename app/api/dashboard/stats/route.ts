import { NextResponse } from "next/server";
import { QuoteStatus, ReminderStatus } from "@prisma/client";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function quoteTotalAmount(quote: {
  amount: unknown;
  lines: {
    quantity: unknown;
    unitPrice: unknown;
  }[];
}) {
  if (quote.lines.length > 0) {
    return quote.lines.reduce((sum, line) => {
      return sum + Number(line.quantity) * Number(line.unitPrice);
    }, 0);
  }

  return Number(quote.amount ?? 0);
}

export async function GET() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const [
      totalProspects,
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      pendingReminders,
      sentReminders,
      latestProspects,
      latestQuotesRaw,
      latestPendingReminders,
      latestReminders,
      quotesForTotal,
    ] = await Promise.all([
      prisma.prospect.count({
        where: { userId: dbUser.id },
      }),

      prisma.quote.count({
        where: { prospect: { userId: dbUser.id } },
      }),

      prisma.quote.count({
        where: {
          status: QuoteStatus.ACCEPTED,
          prospect: { userId: dbUser.id },
        },
      }),

      prisma.quote.count({
        where: {
          status: QuoteStatus.REJECTED,
          prospect: { userId: dbUser.id },
        },
      }),

      prisma.reminder.count({
        where: {
          status: ReminderStatus.PENDING_APPROVAL,
          quote: { prospect: { userId: dbUser.id } },
        },
      }),

      prisma.reminder.count({
        where: {
          status: ReminderStatus.SENT,
          quote: { prospect: { userId: dbUser.id } },
        },
      }),

      prisma.prospect.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          createdAt: true,
        },
      }),

      prisma.quote.findMany({
        where: { prospect: { userId: dbUser.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          quoteNumber: true,
          status: true,
          amount: true,
          currency: true,
          createdAt: true,
          lines: {
            select: {
              quantity: true,
              unitPrice: true,
            },
          },
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
        where: {
          status: ReminderStatus.PENDING_APPROVAL,
          quote: { prospect: { userId: dbUser.id } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
          quote: {
            select: {
              id: true,
              title: true,
              quoteNumber: true,
              prospect: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  company: true,
                },
              },
            },
          },
        },
      }),

      prisma.reminder.findMany({
        where: {
          quote: { prospect: { userId: dbUser.id } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
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

      prisma.quote.findMany({
        where: { prospect: { userId: dbUser.id } },
        select: {
          amount: true,
          lines: {
            select: {
              quantity: true,
              unitPrice: true,
            },
          },
        },
      }),
    ]);

    const totalQuoteAmount = quotesForTotal.reduce((sum, quote) => {
      return sum + quoteTotalAmount(quote);
    }, 0);

    const latestQuotes = latestQuotesRaw.map((quote) => ({
      id: quote.id,
      title: quote.title,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      currency: quote.currency,
      createdAt: quote.createdAt,
      prospect: quote.prospect,
      totalAmount: quoteTotalAmount(quote),
    }));

    const conversionRate =
      totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

    return NextResponse.json({
      totalProspects,
      totalQuotes,
      totalQuoteAmount,
      acceptedQuotes,
      rejectedQuotes,
      conversionRate,
      pendingReminders,
      sentReminders,
      latestProspects,
      latestQuotes,
      latestPendingReminders,
      latestReminders,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("DASHBOARD_STATS_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
