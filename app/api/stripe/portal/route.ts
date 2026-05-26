import { NextRequest, NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function getAppUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).replace(
    /\/$/,
    ""
  );
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

    if (!dbUser.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "Aucun client Stripe n'est associé à ce compte. Passez d'abord au plan Pro.",
        },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl(request);
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${appUrl}/account`,
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
