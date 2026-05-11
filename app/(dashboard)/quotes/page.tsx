"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

type Quote = {
  id: string;
  title: string;
  quoteNumber: string | null;
  status: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  validUntil: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  prospect: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: string | null) {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}

function formatAmount(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/quotes")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des devis");
        }

        return res.json() as Promise<Quote[]>;
      })
      .then(setQuotes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredQuotes = useMemo(() => {
    if (statusFilter === "ALL") return quotes;
    return quotes.filter((quote) => quote.status === statusFilter);
  }, [quotes, statusFilter]);

  const totalAmount = filteredQuotes.reduce((sum, quote) => {
    return sum + quote.totalAmount;
  }, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Devis</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Liste globale de tous vos devis, prospects liés et montants.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/prospects/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nouveau prospect
          </Link>

          <Link
            href="/dashboard"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Nombre de devis</p>
          <p className="mt-2 text-3xl font-semibold">{filteredQuotes.length}</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Montant affiché</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatAmount(totalAmount)}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Filtre</p>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="SENT">Envoyé</option>
            <option value="ACCEPTED">Accepté</option>
            <option value="REJECTED">Refusé</option>
            <option value="EXPIRED">Expiré</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && filteredQuotes.length === 0 && (
        <div className="rounded-lg border bg-card px-5 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun devis trouvé.
          </p>
        </div>
      )}

      {!loading && !error && filteredQuotes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Numéro</th>
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="px-4 py-3 font-medium">Prospect</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                <th className="px-4 py-3 font-medium">Validité</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {filteredQuotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {quote.quoteNumber ?? "—"}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="hover:underline"
                    >
                      {quote.title}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    <Link
                      href={`/prospects/${quote.prospect.id}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {quote.prospect.company ?? quote.prospect.name}
                    </Link>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatAmount(quote.totalAmount, quote.currency)}
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {statusLabel(quote.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(quote.createdAt)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(quote.validUntil)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/quotes/${quote.id}`}
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
