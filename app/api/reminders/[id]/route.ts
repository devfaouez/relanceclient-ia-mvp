import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { updateReminderSchema } from "@/lib/validations";
import { ReminderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

function getScheduledAtInput(body: unknown) {
  if (!body || typeof body !== "object" || !("scheduledAt" in body)) {
    return undefined;
  }

  return (body as { scheduledAt?: unknown }).scheduledAt;
}

function getStatusInput(body: unknown) {
  if (!body || typeof body !== "object" || !("status" in body)) {
    return undefined;
  }

  return (body as { status?: unknown }).status;
}

function isInvalidDateInput(value: unknown) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return true;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime());
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return true;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime());
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const reminder = await prisma.reminder.findFirst({
      where: {
        id: params.id,
        quote: { prospect: { userId: dbUser.id } },
      },
    });

    if (!reminder) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(reminder);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("REMINDER_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (isInvalidDateInput(getScheduledAtInput(body))) {
      return NextResponse.json(
        { error: "Date de programmation invalide" },
        { status: 422 }
      );
    }

    if (getStatusInput(body) === ReminderStatus.SENT) {
      return NextResponse.json(
        { error: "Le statut SENT ne peut pas être défini manuellement" },
        { status: 422 }
      );
    }

    const parsed = updateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    if (
      parsed.data.status === ReminderStatus.SCHEDULED &&
      !parsed.data.scheduledAt
    ) {
      return NextResponse.json(
        { error: "La date de programmation est obligatoire" },
        { status: 422 }
      );
    }

    const existing = await prisma.reminder.findFirst({
      where: {
        id: params.id,
        quote: { prospect: { userId: dbUser.id } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Empêcher la rétrogradation d'un reminder déjà SENT
    if (existing.status === ReminderStatus.SENT) {
      return NextResponse.json(
        { error: "Cannot modify a reminder already sent" },
        { status: 422 }
      );
    }

    const approvalFields =
      parsed.data.status === ReminderStatus.APPROVED
        ? { approvedById: dbUser.id, approvedAt: new Date() }
        : {};

    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data: { ...parsed.data, ...approvalFields },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("REMINDER_PATCH_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
