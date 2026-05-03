import { NextResponse } from "next/server";
import { ReminderStatus } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({
        totalProspects: 0,
        totalQuotes: 0,
        pendingReminders: 0,
        sentReminders: 0,
        latestProspects: [],
        latestPendingReminders: [],
      });
    }

    const [
      totalProspects,
      totalQuotes,
      pendingReminders,
      sentReminders,
      latestProspects,
      latestPendingReminders,
    ] = await Promise.all([
      prisma.prospect.count({
        where: { userId: dbUser.id },
      }),
      prisma.quote.count({
        where: { prospect: { userId: dbUser.id } },
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
    ]);

    return NextResponse.json({
      totalProspects,
      totalQuotes,
      pendingReminders,
      sentReminders,
      latestProspects,
      latestPendingReminders,
    });
  } catch (error) {
    console.error("DASHBOARD_STATS_ERROR:", error);

    return NextResponse.json(
      {
        error: "Dashboard stats error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
