import { NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    return NextResponse.json({
      plan: dbUser.plan ?? "FREE",
      subscriptionStatus: dbUser.subscriptionStatus ?? "INACTIVE",
      currentPeriodEnd: dbUser.currentPeriodEnd ?? null,
      stripeCustomerId: dbUser.stripeCustomerId ?? null,
      stripeSubscriptionId: dbUser.stripeSubscriptionId ?? null,
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
