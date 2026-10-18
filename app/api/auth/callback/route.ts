import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_REDIRECT_PATH = "/dashboard";

/**
 * N'accepte qu'un chemin relatif interne (ex. "/dashboard?tab=1").
 * Rejette "//evil.com", "/\\evil.com", "@evil.com", "https://..." etc.
 * pour éviter les redirections ouvertes.
 */
function getSafeRedirectPath(value: string | null, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
    return DEFAULT_REDIRECT_PATH;
  }

  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return DEFAULT_REDIRECT_PATH;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"), origin);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Supabase auth callback failed", error);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Upsert de l'utilisateur Prisma à la confirmation d'email
  if (data.user.email) {
    try {
      await prisma.user.upsert({
        where: { email: data.user.email },
        update: {},
        create: {
          email: data.user.email,
          name:
            (data.user.user_metadata?.full_name as string | undefined) ??
            (data.user.user_metadata?.name as string | undefined) ??
            null,
        },
      });
    } catch (e) {
      // On log mais on ne bloque pas la connexion : le helper
      // requireCurrentUserWithDb retentera l'upsert au premier appel API.
      console.error("Failed to upsert user on callback", e);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
