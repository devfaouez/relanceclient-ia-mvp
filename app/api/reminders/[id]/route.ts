import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateReminderSchema } from "@/lib/validations";
import { ReminderStatus } from "@prisma/client";

// TODO: Replace with authenticated user ID from Supabase session
const DEMO_USER_ID = "demo-user-id";

type RouteContext = { params: { id: string } };

const ownershipFilter = (id: string) => ({
  id,
  quote: { prospect: { userId: DEMO_USER_ID } },
});

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const reminder = await prisma.reminder.findFirst({
    where: ownershipFilter(params.id),
  });

  if (!reminder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(reminder);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateReminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const existing = await prisma.reminder.findFirst({
    where: ownershipFilter(params.id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const approvalFields =
    parsed.data.status === ReminderStatus.APPROVED
      ? { approvedById: DEMO_USER_ID, approvedAt: new Date() }
      : {};

  const reminder = await prisma.reminder.update({
    where: { id: params.id },
    data: { ...parsed.data, ...approvalFields },
  });

  return NextResponse.json(reminder);
}
