import { NextRequest, NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCompanySettingsSchema } from "@/lib/validations";
import type { ReminderTone, Trade } from "@prisma/client";

export const dynamic = "force-dynamic";

function normalizeEmpty(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasOwnField(body: unknown, key: string) {
  return (
    typeof body === "object" &&
    body !== null &&
    Object.prototype.hasOwnProperty.call(body, key)
  );
}

type UserPreferencesPatch = {
  businessName?: string | null;
  logoUrl?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyWebsite?: string | null;
  trade?: Trade | null;
  defaultTone?: ReminderTone;
  signatureBlock?: string | null;
  quoteFooter?: string | null;
};

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
      trade: preferences?.trade ?? "",
      defaultTone: preferences?.defaultTone ?? "PROFESSIONAL",
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

    const parsed = updateCompanySettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const preferencesData: UserPreferencesPatch = {};

    if (hasOwnField(body, "businessName")) {
      preferencesData.businessName = normalizeEmpty(data.businessName);
    }
    if (hasOwnField(body, "logoUrl")) {
      preferencesData.logoUrl = normalizeEmpty(data.logoUrl);
    }
    if (hasOwnField(body, "companyAddress")) {
      preferencesData.companyAddress = normalizeEmpty(data.companyAddress);
    }
    if (hasOwnField(body, "companyPhone")) {
      preferencesData.companyPhone = normalizeEmpty(data.companyPhone);
    }
    if (hasOwnField(body, "companyEmail")) {
      preferencesData.companyEmail = normalizeEmpty(data.companyEmail);
    }
    if (hasOwnField(body, "companyWebsite")) {
      preferencesData.companyWebsite = normalizeEmpty(data.companyWebsite);
    }
    if (hasOwnField(body, "trade")) {
      preferencesData.trade = data.trade === "" ? null : data.trade ?? null;
    }
    if (hasOwnField(body, "defaultTone") && data.defaultTone) {
      preferencesData.defaultTone = data.defaultTone;
    }
    if (hasOwnField(body, "signatureBlock")) {
      preferencesData.signatureBlock = normalizeEmpty(data.signatureBlock);
    }
    if (hasOwnField(body, "quoteFooter")) {
      preferencesData.quoteFooter = normalizeEmpty(data.quoteFooter);
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        ...preferencesData,
      },
      update: preferencesData,
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
