import { Buffer } from "node:buffer";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import {
  prepareQuotePdfPreferences,
  QuotePdfDocument,
  type QuotePdfPreferences,
  type QuotePdfQuote,
} from "@/lib/pdf/quote-pdf";

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

async function renderDocumentBuffer(
  quote: QuotePdfQuote,
  preferences: QuotePdfPreferences
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

export async function renderQuotePdfBuffer(
  quote: QuotePdfQuote,
  preferences: QuotePdfPreferences
) {
  const pdfPreferences = await prepareQuotePdfPreferences(preferences);

  try {
    return await renderDocumentBuffer(quote, pdfPreferences);
  } catch (error) {
    if (!pdfPreferences?.logoUrl) {
      throw error;
    }

    console.warn("QUOTE_PDF_LOGO_RENDER_ERROR:", error);
    return renderDocumentBuffer(quote, { ...pdfPreferences, logoUrl: null });
  }
}
