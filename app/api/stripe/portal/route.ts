import { NextRequest, NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function getAppUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).replace(
    /\/$/,
    ""
  );
}

type PortalAction = "manage" | "switch_to_yearly";

function getPortalAction(value: unknown): PortalAction {
  return value === "switch_to_yearly" ? "switch_to_yearly" : "manage";
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

    const { dbUser } = await requireCurrentUserWithDb();
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const bodyRecord =
      body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const action = getPortalAction(
      "action" in bodyRecord ? bodyRecord.action : undefined
    );

    if (!dbUser.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "Aucun client Stripe n'est associé à ce compte. Passez d'abord au plan Pro.",
        },
        { status: 400 }
      );
    }

    if (action === "switch_to_yearly" && !dbUser.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error:
            "Aucun abonnement Stripe actif n'est associé à ce compte. Passez d'abord au plan Pro.",
        },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl(request);
    const session = await createBillingPortalSession({
      stripe,
      customerId: dbUser.stripeCustomerId,
      returnUrl: `${appUrl}/account`,
      subscriptionId: dbUser.stripeSubscriptionId,
      targetBillingCycle:
        action === "switch_to_yearly" ? "yearly" : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("STRIPE_PORTAL_ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Impossible d'ouvrir le portail Stripe. Vérifiez que Stripe Portal est configuré.",
      },
      { status: 500 }
    );
  }
}
