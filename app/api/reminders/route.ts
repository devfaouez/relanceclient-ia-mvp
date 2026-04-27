import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TODO: Replace with authenticated user ID from Supabase session
const DEMO_USER_ID = "demo-user-id";

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    where: {
      quote: {
        prospect: { userId: DEMO_USER_ID },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reminders);
}
