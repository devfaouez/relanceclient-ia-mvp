"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
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
            Suivi de devis & relances
          </p>
          <h1 className="mt-4 text-[34px] font-extrabold leading-[1.1] text-white">
            Ne laissez plus jamais un devis s&apos;endormir.
          </h1>
          <p className="mt-[18px] text-[15px] leading-6 text-[#e7f3ee]/80">
            Reprenez la main sur vos devis en attente. On prépare la relance,
            vous validez, on envoie.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[13px] font-medium text-[#8fc1ac]">
          <ShieldCheck className="h-4 w-4" />
          Aucun email envoyé sans votre validation
        </div>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8 lg:min-h-0">
        <div className="w-full max-w-[408px]">
          <Link
            href="/"
            className="mb-10 flex items-center gap-3 [font-family:var(--font-display)] text-[17px] font-bold tracking-normal text-foreground lg:hidden"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <BarChart3 className="h-[17px] w-[17px]" strokeWidth={2.2} />
            </span>
            RelanceClient&nbsp;IA
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28),0_4px_12px_-6px_rgba(7,55,42,0.12)] sm:p-8">
            <h2 className="text-[28px] font-bold">Connexion</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Heureux de vous revoir. Connectez-vous à votre espace.
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-[7px] w-full rounded-[11px] border border-input bg-card px-[13px] py-[11px] text-sm text-foreground outline-none transition placeholder:text-[#9aa8a2] focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-[11px] border border-transparent bg-primary px-4 py-[13px] text-sm font-semibold leading-none text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),var(--surface-shadow)] transition hover:-translate-y-0.5 hover:bg-[#0a7457] hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#0a5f48] hover:underline"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
