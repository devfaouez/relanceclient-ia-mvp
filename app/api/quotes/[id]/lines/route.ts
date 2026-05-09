import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { createQuoteLineSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const quote = await prisma.quote.findFirst({
      where: { id: params.id, prospect: { userId: dbUser.id } },
      select: { id: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const lines = await prisma.quoteLine.findMany({
      where: { quoteId: params.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(lines);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTE_LINES_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const quote = await prisma.quote.findFirst({
      where: { id: params.id, prospect: { userId: dbUser.id } },
      select: { id: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createQuoteLineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const line = await prisma.quoteLine.create({
      data: {
        quoteId: params.id,
        description: parsed.data.description,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTE_LINES_CREATE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
