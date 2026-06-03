"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Check, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setConfirmed(true);
    setLoading(false);
  }

  if (confirmed) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <AuthAside />
        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8 lg:min-h-0">
          <div className="w-full max-w-[408px]">
            <MobileLogo />
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28),0_4px_12px_-6px_rgba(7,55,42,0.12)] sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-[#0a5f48]">
                <MailCheck className="h-5 w-5" />
              </span>
              <h1 className="mt-5 text-[28px] font-bold">
                Vérifiez votre boîte mail
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Un email de confirmation a été envoyé à{" "}
                <strong className="font-semibold text-foreground">{email}</strong>.
                Cliquez sur le lien pour activer votre compte.
              </p>
              <p className="mt-6 text-center text-sm">
                <Link
                  href="/login"
                  className="font-semibold text-[#0a5f48] hover:underline"
                >
                  Retour à la connexion
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <AuthAside />

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8 lg:min-h-0">
        <div className="w-full max-w-[408px]">
          <MobileLogo />

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28),0_4px_12px_-6px_rgba(7,55,42,0.12)] sm:p-8">
            <h1 className="text-[28px] font-bold">Créer un compte</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Commencez avec la formule Free. Aucune carte bancaire requise.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
                >
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13px] font-semibold text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="vous@entreprise.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-[7px] w-full rounded-[11px] border border-input bg-card px-[13px] py-[11px] text-sm text-foreground outline-none transition placeholder:text-[#9aa8a2] focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-[13px] font-semibold text-foreground"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-[7px] w-full rounded-[11px] border border-input bg-card px-[13px] py-[11px] text-sm text-foreground outline-none transition placeholder:text-[#9aa8a2] focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  6 caractères minimum
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-[11px] border border-transparent bg-primary px-4 py-[13px] text-sm font-semibold leading-none text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),var(--surface-shadow)] transition hover:-translate-y-0.5 hover:bg-[#0a7457] hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? "Inscription…" : "Créer un compte"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0a5f48] hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#07372a] to-[#052a20] px-12 py-14 text-white lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_360px_at_85%_0%,rgba(13,138,102,0.45),transparent_60%)]" />
      <div className="relative z-10 flex items-center gap-3 [font-family:var(--font-display)] text-[17px] font-bold tracking-normal">
        <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          <BarChart3 className="h-[17px] w-[17px]" strokeWidth={2.2} />
        </span>
        RelanceClient&nbsp;IA
      </div>

      <div className="relative z-10 my-auto max-w-[390px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.13em] text-[#6fd3ae]">
          Formule Free disponible
        </p>
        <h2 className="mt-4 text-[34px] font-extrabold leading-[1.1] text-white">
          Vos prochains chantiers sont déjà dans votre boîte mail.
        </h2>
        <p className="mt-[18px] text-[15px] leading-6 text-[#e7f3ee]/80">
          Créez votre compte et centralisez vos devis, relances et suivis
          commerciaux.
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-[11px]">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#8fc1ac]">
          <Check className="h-4 w-4" strokeWidth={2.4} />
          5 devis et 10 relances IA par mois en Free
        </div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#8fc1ac]">
          <Check className="h-4 w-4" strokeWidth={2.4} />
          Validation avant chaque envoi
        </div>
      </div>
    </aside>
  );
}

function MobileLogo() {
  return (
    <Link
      href="/"
      className="mb-10 flex items-center gap-3 [font-family:var(--font-display)] text-[17px] font-bold tracking-normal text-foreground lg:hidden"
    >
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
        <BarChart3 className="h-[17px] w-[17px]" strokeWidth={2.2} />
      </span>
      RelanceClient&nbsp;IA
    </Link>
  );
}
