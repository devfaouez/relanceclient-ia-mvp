import { NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import {
  getProPriceId,
  getSubscriptionBillingCycle,
  type BillingCycle,
} from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function canManageSubscription(status: string) {
  return status === "ACTIVE" || status === "TRIALING";
}

export async function GET() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();
    let billingCycle: BillingCycle | null = null;

    if (dbUser.stripeSubscriptionId) {
      const stripe = getStripe();

      if (stripe) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            dbUser.stripeSubscriptionId,
          );

          billingCycle = getSubscriptionBillingCycle(stripeSubscription);
        } catch (error) {
          console.warn("ACCOUNT_SUBSCRIPTION_STRIPE_LOOKUP_ERROR:", error);
        }
      }
    }

    return NextResponse.json({
      plan: dbUser.plan ?? "FREE",
      subscriptionStatus: dbUser.subscriptionStatus ?? "INACTIVE",
      currentPeriodEnd: dbUser.currentPeriodEnd ?? null,
      stripeCustomerId: dbUser.stripeCustomerId ?? null,
      stripeSubscriptionId: dbUser.stripeSubscriptionId ?? null,
      billingCycle,
      canSwitchToYearly:
        dbUser.plan === "PRO" &&
        canManageSubscription(dbUser.subscriptionStatus) &&
        billingCycle === "monthly" &&
        Boolean(
          dbUser.stripeCustomerId &&
            dbUser.stripeSubscriptionId &&
            getProPriceId("yearly"),
        ),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("ACCOUNT_SUBSCRIPTION_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
