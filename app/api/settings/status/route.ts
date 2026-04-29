import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function maskEmailAddress(value: string) {
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) return "Configuré";

  const visibleStart = localPart.slice(0, 2);
  const visibleEnd = localPart.length > 4 ? localPart.slice(-1) : "";

  return `${visibleStart}${"*".repeat(4)}${visibleEnd}@${domain}`;
}

export async function GET() {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  return NextResponse.json({
    userEmail: user.email ?? null,
    supabaseAuthConfigured: true,
    prismaDatabaseSynced: Boolean(process.env.DATABASE_URL),
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY),
    resendFromEmailConfigured: Boolean(resendFromEmail),
    resendFromEmailDisplay: resendFromEmail
      ? maskEmailAddress(resendFromEmail)
      : "Fallback : RelanceClient IA <onboarding@resend.dev>",
    resendDomainVerified: false,
  });
}
