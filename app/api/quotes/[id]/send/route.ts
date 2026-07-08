import { NextRequest, NextResponse } from "next/server";
import { QuoteStatus } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { renderQuotePdfBuffer } from "@/lib/pdf/render-quote-pdf";
import {
  buildQuoteEmailHtml,
  buildQuoteEmailText,
} from "@/lib/email/templates/quote";
import { buildSender } from "@/lib/email/sender";

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

function quoteSendError(message: string, status: number) {
  return NextResponse.json(
    {
      error: message,
      sent: false,
    },
    { status }
  );
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !fromEmail) {
      console.error("QUOTE_SEND_ERROR: Resend email configuration missing");
      return quoteSendError(
        "Configuration Resend manquante : RESEND_API_KEY ou RESEND_FROM_EMAIL n'est pas défini. Le devis n'a pas été envoyé.",
        500
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
      return quoteSendError(
        "Impossible d'envoyer le devis : le prospect n'a pas d'adresse email.",
        422
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
      console.error("QUOTE_SEND_PDF_ERROR:", error);
      return quoteSendError(
        "Impossible de générer le PDF du devis. Vérifiez les informations du devis et le logo configuré.",
        500
      );
    }

    const quoteLabel = cleanText(quote.quoteNumber) ?? quote.title;
    const filenameLabel = pdfFilenameLabel(
      cleanText(quote.quoteNumber) ?? quote.id.slice(0, 8)
    );
    const businessName = cleanText(preferences?.businessName);
    const sender = buildSender({
      fromEmail: process.env.RESEND_FROM_EMAIL ?? "",
      businessName: preferences?.businessName,
      companyEmail: preferences?.companyEmail,
    });
    const resend = new Resend(resendApiKey);

    const { error: sendError } = await resend.emails.send({
      from: sender.from,
      to: prospectEmail,
      replyTo: sender.replyTo,
      subject: `Devis ${quoteLabel}`,
      text: buildQuoteEmailText({
        prospectName: quote.prospect.name,
        businessName,
        quoteLabel,
      }),
      html: buildQuoteEmailHtml({
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
      return quoteSendError(
        "Erreur Resend lors de l'envoi du devis. Le devis n'a pas été marqué comme envoyé.",
        502
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
    return quoteSendError(
      "Erreur serveur lors de l'envoi du devis. Le devis n'a pas été marqué comme envoyé.",
      500
    );
  }
}
