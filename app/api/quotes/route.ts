import { NextRequest, NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createQuoteSchema } from "@/lib/validations";
import {
  getAccountUsage,
  hasReachedLimit,
} from "@/lib/subscription-limits";

export const dynamic = "force-dynamic";

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

    const quotes = await prisma.quote.findMany({
      where: {
        prospect: {
          userId: dbUser.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        quoteNumber: true,
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        validUntil: true,
        sentAt: true,
        acceptedAt: true,
        rejectedAt: true,
        prospect: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        lines: {
          select: {
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    return NextResponse.json(
      quotes.map((quote) => ({
        id: quote.id,
        title: quote.title,
        quoteNumber: quote.quoteNumber,
        status: quote.status,
        currency: quote.currency,
        totalAmount: quoteTotalAmount(quote),
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        validUntil: quote.validUntil,
        sentAt: quote.sentAt,
        acceptedAt: quote.acceptedAt,
        rejectedAt: quote.rejectedAt,
        prospect: quote.prospect,
      }))
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTES_GET_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const prospectId =
      typeof body === "object" &&
      body !== null &&
      "prospectId" in body &&
      typeof body.prospectId === "string"
        ? body.prospectId
        : null;

    if (!prospectId) {
      return NextResponse.json(
        { error: "Validation error", details: { prospectId: "Required" } },
        { status: 422 }
      );
    }

    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId: dbUser.id },
      select: { id: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const usage = await getAccountUsage(
      dbUser.id,
      dbUser.plan,
      dbUser.subscriptionStatus
    );
    if (hasReachedLimit(usage.quotesUsed, usage.maxQuotes)) {
      return NextResponse.json(
        {
          error:
            "Limite du plan Gratuit atteinte : vous avez déjà créé 5 devis. Passez au plan Pro pour créer des devis en illimité.",
        },
        { status: 403 }
      );
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
        prospectId,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTES_CREATE_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
