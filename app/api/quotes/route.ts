import { NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
