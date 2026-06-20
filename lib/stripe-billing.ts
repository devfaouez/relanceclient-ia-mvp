import type Stripe from "stripe";

export type BillingCycle = "monthly" | "yearly";

type PortalSessionOptions = {
  stripe: Stripe;
  customerId: string;
  returnUrl: string;
  subscriptionId?: string | null;
  targetBillingCycle?: BillingCycle;
};

export function getProPriceId(billingCycle: BillingCycle) {
  if (billingCycle === "yearly") {
    return process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  }

  return (
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID ??
    process.env.STRIPE_PRO_PRICE_ID ??
    process.env.STRIPE_PRICE_PRO_ID
  );
}

export function getBillingCycleForPriceId(
  priceId: string | null | undefined,
): BillingCycle | null {
  if (!priceId) {
    return null;
  }

  if (priceId === getProPriceId("yearly")) {
    return "yearly";
  }

  if (priceId === getProPriceId("monthly")) {
    return "monthly";
  }

  return null;
}

export function getPrimarySubscriptionItem(subscription: Stripe.Subscription) {
  return subscription.items.data[0] ?? null;
}

export function getSubscriptionBillingCycle(
  subscription: Stripe.Subscription,
): BillingCycle | null {
  return getBillingCycleForPriceId(
    getPrimarySubscriptionItem(subscription)?.price.id,
  );
}

export async function createBillingPortalSession({
  stripe,
  customerId,
  returnUrl,
  subscriptionId,
  targetBillingCycle,
}: PortalSessionOptions) {
  let flowData:
    | NonNullable<Stripe.BillingPortal.SessionCreateParams["flow_data"]>
    | undefined;

  if (targetBillingCycle) {
    const targetPriceId = getProPriceId(targetBillingCycle);

    if (!targetPriceId) {
      throw new Error(`Stripe Pro ${targetBillingCycle} price is not configured`);
    }

    if (!subscriptionId) {
      throw new Error("No active Stripe subscription is associated with this account");
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItem = getPrimarySubscriptionItem(subscription);
    const currentBillingCycle = getSubscriptionBillingCycle(subscription);

    if (currentItem && currentBillingCycle !== targetBillingCycle) {
      flowData = {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: subscription.id,
          items: [
            {
              id: currentItem.id,
              price: targetPriceId,
              quantity: currentItem.quantity ?? 1,
            },
          ],
        },
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: `${returnUrl}?updated=1`,
          },
        },
      };
    }
  }

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    flow_data: flowData,
  });
}
