import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stripeId(
  value:
    | string
    | { id: string; deleted?: unknown }
    | null
    | undefined
) {
  if (!value || typeof value === "string") {
    return value ?? null;
  }

  return value.deleted ? null : value.id;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;

  return periodEnd ? new Date(periodEnd * 1000) : null;
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): {
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
} {
  switch (status) {
    case "active":
      return {
        plan: SubscriptionPlan.PRO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      };
    case "trialing":
      return {
        plan: SubscriptionPlan.PRO,
        subscriptionStatus: SubscriptionStatus.TRIALING,
      };
    case "past_due":
    case "unpaid":
      return {
        plan: SubscriptionPlan.PRO,
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
      };
    case "canceled":
      return {
        plan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.CANCELED,
      };
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return {
        plan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.INACTIVE,
      };
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = stripeId(subscription.customer);
  const mapped = mapSubscriptionStatus(subscription.status);
  const userId = subscription.metadata.userId;

  const where = userId
    ? { id: userId }
    : subscription.id
      ? { stripeSubscriptionId: subscription.id }
      : customerId
        ? { stripeCustomerId: customerId }
        : null;

  if (!where) {
    console.warn("STRIPE_WEBHOOK_NO_USER_REFERENCE:", subscription.id);
    return;
  }

  await prisma.user.update({
    where,
    data: {
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      ...mapped,
    },
  });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe
) {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  const customerId = stripeId(session.customer);
  const subscriptionId = stripeId(session.subscription);

  if (userId && customerId) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscription(subscription);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = stripeId(subscription.customer);
  const userId = subscription.metadata.userId;

  const where = userId
    ? { id: userId }
    : subscription.id
      ? { stripeSubscriptionId: subscription.id }
      : customerId
        ? { stripeCustomerId: customerId }
        : null;

  if (!where) {
    console.warn("STRIPE_WEBHOOK_NO_USER_REFERENCE:", subscription.id);
    return;
  }

  await prisma.user.update({
    where,
    data: {
      plan: SubscriptionPlan.FREE,
      subscriptionStatus: SubscriptionStatus.CANCELED,
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: null,
    },
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("STRIPE_WEBHOOK_SIGNATURE_ERROR:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          stripe
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("STRIPE_WEBHOOK_HANDLER_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
