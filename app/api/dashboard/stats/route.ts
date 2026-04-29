import { NextResponse } from "next/server";
import { ReminderStatus } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      where: { userId: user.id },
    }),
    prisma.quote.count({
      where: { prospect: { userId: user.id } },
    }),
    prisma.reminder.count({
      where: {
        status: ReminderStatus.PENDING_APPROVAL,
        quote: { prospect: { userId: user.id } },
      },
    }),
    prisma.reminder.count({
      where: {
        status: ReminderStatus.SENT,
        quote: { prospect: { userId: user.id } },
      },
    }),
    prisma.prospect.findMany({
      where: { userId: user.id },
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
        quote: { prospect: { userId: user.id } },
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
}
