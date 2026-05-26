import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AI_REMINDER_GENERATE_FEATURE = "reminder_generate";

export const SUBSCRIPTION_LIMITS: Record<
  SubscriptionPlan,
  {
    maxQuotes: number | null;
    maxAiRemindersPerMonth: number | null;
  }
> = {
  FREE: {
    maxQuotes: 5,
    maxAiRemindersPerMonth: 10,
  },
  PRO: {
    maxQuotes: null,
    maxAiRemindersPerMonth: null,
  },
};

export function hasUnlimitedAccess(
  plan: SubscriptionPlan,
  subscriptionStatus: SubscriptionStatus
) {
  return (
    plan === "PRO" &&
    (subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING")
  );
}

export function getSubscriptionLimits(
  plan: SubscriptionPlan,
  subscriptionStatus: SubscriptionStatus
) {
  return hasUnlimitedAccess(plan, subscriptionStatus)
    ? SUBSCRIPTION_LIMITS.PRO
    : SUBSCRIPTION_LIMITS.FREE;
}

export function hasReachedLimit(used: number, limit: number | null) {
  return limit !== null && used >= limit;
}

export function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

export async function getAccountUsage(
  userId: string,
  plan: SubscriptionPlan,
  subscriptionStatus: SubscriptionStatus
) {
  const limits = getSubscriptionLimits(plan, subscriptionStatus);
  const { start, end } = currentMonthRange();

  const [quotesUsed, aiRemindersUsedThisMonth] = await Promise.all([
    prisma.quote.count({
      where: {
        prospect: {
          userId,
        },
      },
    }),
    prisma.aiUsage.count({
      where: {
        userId,
        feature: AI_REMINDER_GENERATE_FEATURE,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),
  ]);

  return {
    quotesUsed,
    maxQuotes: limits.maxQuotes,
    aiRemindersUsedThisMonth,
    maxAiRemindersPerMonth: limits.maxAiRemindersPerMonth,
  };
}
