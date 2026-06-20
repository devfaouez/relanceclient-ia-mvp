import { NextRequest, NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createBillingPortalSession,
  getProPriceId,
  type BillingCycle,
} from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function getAppUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).replace(
    /\/$/,
    ""
  );
}

function getBillingCycle(value: unknown): BillingCycle {
  return value === "yearly" ? "yearly" : "monthly";
}

function hasExistingSubscription(status: string) {
  return status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const bodyRecord =
      body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const billingCycle = getBillingCycle(
      "billingCycle" in bodyRecord
        ? bodyRecord.billingCycle
        : "billingInterval" in bodyRecord
          ? bodyRecord.billingInterval
          : undefined
    );
    const priceId = getProPriceId(billingCycle);

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe Pro ${billingCycle} price is not configured`,
        },
        { status: 500 }
      );
    }

    const { dbUser } = await requireCurrentUserWithDb();
    const appUrl = getAppUrl(request);

    if (
      dbUser.stripeCustomerId &&
      hasExistingSubscription(dbUser.subscriptionStatus)
    ) {
      const portalSession = await createBillingPortalSession({
        stripe,
        customerId: dbUser.stripeCustomerId,
        returnUrl: `${appUrl}/account`,
        subscriptionId: dbUser.stripeSubscriptionId,
        targetBillingCycle:
          dbUser.stripeSubscriptionId && billingCycle === "yearly"
            ? "yearly"
            : undefined,
      });

      return NextResponse.json({ url: portalSession.url, mode: "portal" });
    }

    let stripeCustomerId = dbUser.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name ?? undefined,
        metadata: {
          userId: dbUser.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: dbUser.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: dbUser.id,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: dbUser.id,
          billingCycle,
        },
      },
      success_url: `${appUrl}/account?success=1`,
      cancel_url: `${appUrl}/account?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("STRIPE_CHECKOUT_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
