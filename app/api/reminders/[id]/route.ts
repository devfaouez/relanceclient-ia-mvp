import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { updateReminderSchema } from "@/lib/validations";
import { ReminderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminder = await prisma.reminder.findFirst({
    where: { id: params.id, quote: { prospect: { userId: user.id } } },
  });

  if (!reminder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(reminder);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    where: { id: params.id, quote: { prospect: { userId: user.id } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const approvalFields =
    parsed.data.status === ReminderStatus.APPROVED
      ? { approvedById: user.id, approvedAt: new Date() }
      : {};

  const reminder = await prisma.reminder.update({
    where: { id: params.id },
    data: { ...parsed.data, ...approvalFields },
  });

  return NextResponse.json(reminder);
}
