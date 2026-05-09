import { NextRequest, NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { generateReminderSchema } from "@/lib/validations";
import {
  generateReminderWithAi,
  AiQuotaExceededError,
  AiGenerationError,
} from "@/lib/ai/reminder-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = generateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const reminder = await generateReminderWithAi({
      userId: dbUser.id,
      quoteId: parsed.data.quoteId,
      templateId: parsed.data.templateId ?? null,
      userNote: parsed.data.userNote ?? null,
      toneOverride: parsed.data.tone,
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof AiQuotaExceededError) {
      return NextResponse.json(
        { error: "AI daily quota exceeded", limit: error.limit },
        { status: 429 }
      );
    }
    if (error instanceof AiGenerationError) {
      console.error("AI_GENERATION_ERROR:", error, error.cause);
      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 502 }
      );
    }
    console.error("REMINDER_GENERATE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
