import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { createQuoteSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

async function generateQuoteNumber(userId: string) {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;

  const quotes = await prisma.quote.findMany({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
      prospect: {
        userId,
      },
    },
    select: {
      quoteNumber: true,
    },
  });

  const lastNumber = quotes.reduce((max, quote) => {
    if (!quote.quoteNumber) return max;

    const match = quote.quoteNumber.match(/^DEV-\d{4}-(\d{4})$/);
    if (!match) return max;

    return Math.max(max, Number(match[1]));
  }, 0);

  return `${prefix}${String(lastNumber + 1).padStart(4, "0")}`;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const prospect = await prisma.prospect.findFirst({
      where: { id: params.id, userId: dbUser.id },
      select: { id: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const quotes = await prisma.quote.findMany({
      where: { prospectId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PROSPECT_QUOTES_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const prospect = await prisma.prospect.findFirst({
      where: { id: params.id, userId: dbUser.id },
      select: { id: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const quoteNumber =
      parsed.data.quoteNumber?.trim() || (await generateQuoteNumber(dbUser.id));

    const quote = await prisma.quote.create({
      data: {
        ...parsed.data,
        quoteNumber,
        prospectId: params.id,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PROSPECT_QUOTES_CREATE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
