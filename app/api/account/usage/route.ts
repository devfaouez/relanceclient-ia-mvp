import { NextResponse } from "next/server";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { getAccountUsage } from "@/lib/subscription-limits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();
    const usage = await getAccountUsage(
      dbUser.id,
      dbUser.plan,
      dbUser.subscriptionStatus
    );

    return NextResponse.json({
      plan: dbUser.plan ?? "FREE",
      subscriptionStatus: dbUser.subscriptionStatus ?? "INACTIVE",
      ...usage,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("ACCOUNT_USAGE_ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
