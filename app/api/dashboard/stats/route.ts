import { NextResponse } from "next/server";
import { ReminderStatus } from "@prisma/client";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

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
