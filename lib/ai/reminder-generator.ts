import { Prisma, ReminderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient, computeCostEur } from "./openai";
import {
  buildReminderPrompt,
  REMINDER_PROMPT_VERSION,
  type ReminderPromptContext,
} from "./prompts/reminder-v1";

const MODEL = process.env.AI_MODEL ?? "gpt-5.5";
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS ?? "600", 10);
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT_PER_USER ?? "50", 10);

export class AiQuotaExceededError extends Error {
  constructor(public limit: number) {
    super(`AI daily quota exceeded (${limit} per day)`);
    this.name = "AiQuotaExceededError";
  }
}

export class AiGenerationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "AiGenerationError";
  }
}

async function checkDailyQuota(userId: string): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const usageToday = await prisma.aiUsage.count({
    where: { userId, createdAt: { gte: startOfDay } },
  });

  if (usageToday >= DAILY_LIMIT) {
    throw new AiQuotaExceededError(DAILY_LIMIT);
  }
}

interface GenerateReminderInput {
  userId: string;
  quoteId: string;
  templateId?: string | null;
  userNote?: string | null;
  toneOverride?: ReminderPromptContext["tone"];
}

export async function generateReminderWithAi(input: GenerateReminderInput) {
  await checkDailyQuota(input.userId);

  const quote = await prisma.quote.findFirst({
    where: {
      id: input.quoteId,
      prospect: { userId: input.userId },
    },
    include: {
      prospect: true,
      reminders: {
        where: { status: ReminderStatus.SENT },
        orderBy: { sentAt: "desc" },
        select: { subject: true, sentAt: true },
      },
    },
  });

  if (!quote) {
    throw new AiGenerationError("Quote not found");
  }

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: input.userId },
  });

  const previousSentReminders = quote.reminders.filter(
    (r): r is { subject: string; sentAt: Date } => r.sentAt !== null
  );

  const lastContactDate =
    previousSentReminders[0]?.sentAt ?? quote.sentAt ?? quote.createdAt;

  const daysSinceLastContact = Math.floor(
    (Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const ctx: ReminderPromptContext = {
    businessName: prefs?.businessName ?? null,
    trade: prefs?.trade ?? null,
    signatureBlock: prefs?.signatureBlock ?? null,
    tone: input.toneOverride ?? prefs?.defaultTone ?? "PROFESSIONAL",
    prospectName: quote.prospect.name,
    prospectCompany: quote.prospect.company,
    quoteTitle: quote.title,
    quoteNumber: quote.quoteNumber,
    quoteAmount: quote.amount?.toString() ?? null,
    currency: quote.currency,
    quoteSentAt: quote.sentAt,
    iteration: previousSentReminders.length + 1,
    daysSinceLastContact,
    previousReminders: previousSentReminders,
    userNote: input.userNote ?? null,
  };

  const { system, user } = buildReminderPrompt(ctx);

  const openai = getOpenAIClient();
  let responseText: string;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
      max_output_tokens: MAX_TOKENS,
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    responseText = response.output_text;

    inputTokens = response.usage?.input_tokens ?? 0;
    outputTokens = response.usage?.output_tokens ?? 0;
  } catch (err) {
    throw new AiGenerationError("OpenAI API call failed", err);
  }

  if (!responseText) {
    throw new AiGenerationError("No text response from AI");
  }

  let parsed: { subject: string; body: string };

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    parsed = JSON.parse(jsonMatch[0]);

    if (
      typeof parsed.subject !== "string" ||
      typeof parsed.body !== "string" ||
      parsed.subject.length === 0 ||
      parsed.body.length === 0 ||
      parsed.subject.length > 200 ||
      parsed.body.length > 5000
    ) {
      throw new Error("Invalid JSON structure");
    }
  } catch (err) {
    throw new AiGenerationError("Failed to parse AI response", err);
  }

  const finalBody = prefs?.signatureBlock
    ? `${parsed.body}\n\n${prefs.signatureBlock}`
    : parsed.body;

  if (input.templateId) {
    const template = await prisma.reminderTemplate.findFirst({
      where: { id: input.templateId, userId: input.userId },
      select: { id: true },
    });

    if (!template) {
      throw new AiGenerationError("Template not found");
    }
  }

  const cost = computeCostEur(inputTokens, outputTokens);

  const result = await prisma.$transaction(async (tx) => {
    const reminder = await tx.reminder.create({
      data: {
        quoteId: quote.id,
        templateId: input.templateId ?? null,
        subject: parsed.subject.slice(0, 500),
        body: finalBody,
        status: ReminderStatus.PENDING_APPROVAL,
        requiresHumanApproval: true,
        iteration: ctx.iteration,
        generatedByAi: true,
        aiModel: MODEL,
        aiPromptVersion: REMINDER_PROMPT_VERSION,
      },
    });

    await tx.aiUsage.create({
      data: {
        userId: input.userId,
        feature: "reminder_generate",
        inputTokens,
        outputTokens,
        costEur: new Prisma.Decimal(cost.toFixed(6)),
        reminderId: reminder.id,
      },
    });

    return reminder;
  });

  return result;
}
