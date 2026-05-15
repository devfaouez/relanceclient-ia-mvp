import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { QuotePdfDocument } from "@/lib/pdf/quote-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const quote = await prisma.quote.findFirst({
      where: { id: params.id, prospect: { userId: dbUser.id } },
      include: {
        prospect: true,
        lines: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: dbUser.id },
      select: {
        businessName: true,
        logoUrl: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        companyWebsite: true,
        quoteFooter: true,
      },
    });

    let buffer: NodeJS.ReadableStream | Buffer;

    try {
      buffer = await pdf(
        React.createElement(QuotePdfDocument, {
          quote,
          preferences,
        }) as React.ReactElement
      ).toBuffer();
    } catch (error) {
      if (!preferences?.logoUrl) {
        throw error;
      }

      console.warn("QUOTE_PDF_LOGO_ERROR:", error);

      buffer = await pdf(
        React.createElement(QuotePdfDocument, {
          quote,
          preferences: { ...preferences, logoUrl: null },
        }) as React.ReactElement
      ).toBuffer();
    }

    const filename = `devis-${quote.quoteNumber ?? quote.id.slice(0, 8)}.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTE_PDF_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
