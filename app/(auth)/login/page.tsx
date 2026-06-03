"use client";

import { useState } from "react";
import Link from "next/link";
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
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--surface-shadow)]">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--surface-shadow)] hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="underline hover:text-foreground">
            S&apos;inscrire
          </Link>
        </p>
      </form>
    </section>
  );
}
