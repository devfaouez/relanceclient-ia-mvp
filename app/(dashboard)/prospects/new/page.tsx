"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

export default function NewProspectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body: Record<string, string> = { name };
    if (email) body.email = email;
    if (phone) body.phone = phone;
    if (company) body.company = company;

    const res = await fetch("/api/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(
        (json as { error?: string }).error ?? "Erreur lors de la création"
      );
      setLoading(false);
      return;
    }

    router.push("/prospects");
    router.refresh();
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Pilotage
          </p>
          <h1 className="mt-1 text-2xl font-bold">Nouveau prospect</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Ajoutez un contact pour préparer un devis et suivre les relances.
          </p>
        </div>

        <Link
          href="/prospects"
          className="inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold shadow-[var(--surface-shadow)] hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux prospects
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]"
      >
        <div className="border-b bg-[hsl(var(--emerald-tint))]/45 px-5 py-4 sm:px-6">
          <h2 className="text-[17px] font-bold">Informations du prospect</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le nom est obligatoire. Les coordonnées peuvent être complétées plus
            tard.
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="name" className="block text-[13px] font-semibold">
              Nom <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-[13px] font-semibold"
              >
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-[13px] font-semibold"
            >
              Société
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Link
            href="/prospects"
            className="inline-flex items-center justify-center rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--surface-shadow)] hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {loading ? "Création…" : "Créer le prospect"}
          </button>
        </div>
      </form>
    </section>
  );
}
