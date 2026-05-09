import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const companySettingsSchema = z.object({
  businessName: z.string().trim().max(200).nullish(),
  logoUrl: z.string().trim().max(1000).nullish(),
  companyAddress: z.string().trim().max(1000).nullish(),
  companyPhone: z.string().trim().max(100).nullish(),
  companyEmail: z.string().trim().email().max(255).nullish().or(z.literal("")),
  companyWebsite: z.string().trim().max(500).nullish(),
  signatureBlock: z.string().trim().max(2000).nullish(),
  quoteFooter: z.string().trim().max(2000).nullish(),
});

function normalizeEmpty(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({
      businessName: preferences?.businessName ?? "",
      logoUrl: preferences?.logoUrl ?? "",
      companyAddress: preferences?.companyAddress ?? "",
      companyPhone: preferences?.companyPhone ?? "",
      companyEmail: preferences?.companyEmail ?? "",
      companyWebsite: preferences?.companyWebsite ?? "",
      signatureBlock: preferences?.signatureBlock ?? "",
      quoteFooter: preferences?.quoteFooter ?? "",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("COMPANY_SETTINGS_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = companySettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        businessName: normalizeEmpty(data.businessName),
        logoUrl: normalizeEmpty(data.logoUrl),
        companyAddress: normalizeEmpty(data.companyAddress),
        companyPhone: normalizeEmpty(data.companyPhone),
        companyEmail: normalizeEmpty(data.companyEmail),
        companyWebsite: normalizeEmpty(data.companyWebsite),
        signatureBlock: normalizeEmpty(data.signatureBlock),
        quoteFooter: normalizeEmpty(data.quoteFooter),
      },
      update: {
        businessName: normalizeEmpty(data.businessName),
        logoUrl: normalizeEmpty(data.logoUrl),
        companyAddress: normalizeEmpty(data.companyAddress),
        companyPhone: normalizeEmpty(data.companyPhone),
        companyEmail: normalizeEmpty(data.companyEmail),
        companyWebsite: normalizeEmpty(data.companyWebsite),
        signatureBlock: normalizeEmpty(data.signatureBlock),
        quoteFooter: normalizeEmpty(data.quoteFooter),
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("COMPANY_SETTINGS_PATCH_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
