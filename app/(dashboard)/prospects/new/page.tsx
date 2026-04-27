"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <section>
      <div className="flex items-center gap-3">
        <Link
          href="/prospects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Prospects
        </Link>
        <h1 className="text-2xl font-semibold">Nouveau prospect</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
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

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
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
          <label htmlFor="phone" className="block text-sm font-medium">
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

        <div>
          <label htmlFor="company" className="block text-sm font-medium">
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

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Création…" : "Créer le prospect"}
          </button>
          <Link
            href="/prospects"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Annuler
          </Link>
        </div>
      </form>
    </section>
  );
}
