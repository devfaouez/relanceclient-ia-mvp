"use client";

import { useState } from "react";
import Link from "next/link";
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
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Vérifiez votre boîte mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un email de confirmation a été envoyé à <strong>{email}</strong>.
          Cliquez sur le lien pour activer votre compte.
        </p>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="underline hover:text-foreground">
            Retour à la connexion
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Inscription</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">6 caractères minimum</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Inscription…" : "Créer un compte"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Se connecter
          </Link>
        </p>
      </form>
    </section>
  );
}
