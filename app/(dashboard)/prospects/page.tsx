"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Prospect = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prospects")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des prospects");
        return res.json() as Promise<Prospect[]>;
      })
      .then(setProspects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prospects</h1>
        <Link
          href="/prospects/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nouveau prospect
        </Link>
      </div>

      {loading && (
        <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
      )}

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {!loading && !error && prospects.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun prospect pour l&apos;instant.
        </p>
      )}

      {!loading && !error && prospects.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Société</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.company ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
