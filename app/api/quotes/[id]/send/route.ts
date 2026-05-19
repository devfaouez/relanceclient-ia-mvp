import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { QuoteStatus } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { QuotePdfDocument } from "@/lib/pdf/quote-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

function cleanText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function pdfFilenameLabel(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "devis";
}

function buildEmailBody({
  prospectName,
  businessName,
  quoteLabel,
}: {
  prospectName: string;
  businessName: string | null;
  quoteLabel: string;
}) {
  const signature = businessName ? `\n\nCordialement,\n${businessName}` : "";

  return `Bonjour ${prospectName},

Veuillez trouver ci-joint le devis ${quoteLabel}.

Nous restons à votre disposition pour toute question.${signature}`;
}

async function readableToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function renderQuotePdfBuffer(
  quote: Parameters<typeof QuotePdfDocument>[0]["quote"],
  preferences: Parameters<typeof QuotePdfDocument>[0]["preferences"]
) {
  const output = await pdf(
    React.createElement(QuotePdfDocument, {
      quote,
      preferences,
    }) as React.ReactElement
  ).toBuffer();

  if (Buffer.isBuffer(output)) {
    return output;
  }

  return readableToBuffer(output);
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !fromEmail) {
      console.error("QUOTE_SEND_ERROR: Resend email configuration missing");
      return NextResponse.json(
        { error: "Configuration email manquante" },
        { status: 500 }
      );
    }

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

    const prospectEmail = cleanText(quote.prospect.email);
    if (!prospectEmail) {
      return NextResponse.json(
        { error: "Le prospect n'a pas d'adresse email" },
        { status: 422 }
      );
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

    let pdfBuffer: Buffer;

    try {
      pdfBuffer = await renderQuotePdfBuffer(quote, preferences);
    } catch (error) {
      if (!preferences?.logoUrl) {
        throw error;
      }

      console.warn("QUOTE_SEND_PDF_LOGO_ERROR:", error);
      pdfBuffer = await renderQuotePdfBuffer(quote, {
        ...preferences,
        logoUrl: null,
      });
    }

    const quoteLabel = cleanText(quote.quoteNumber) ?? quote.title;
    const filenameLabel = pdfFilenameLabel(
      cleanText(quote.quoteNumber) ?? quote.id.slice(0, 8)
    );
    const businessName = cleanText(preferences?.businessName);
    const resend = new Resend(resendApiKey);

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: prospectEmail,
      subject: `Devis ${quoteLabel}`,
      text: buildEmailBody({
        prospectName: quote.prospect.name,
        businessName,
        quoteLabel,
      }),
      attachments: [
        {
          filename: `devis-${filenameLabel}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (sendError) {
      console.error("QUOTE_SEND_ERROR:", sendError);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi du devis" },
        { status: 502 }
      );
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.SENT, sentAt: new Date() },
      include: {
        prospect: true,
        lines: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTE_SEND_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
