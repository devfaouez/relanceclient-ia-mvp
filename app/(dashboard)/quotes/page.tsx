"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { compareText, formatAmount, formatDate } from "@/lib/formatters";
import { QUOTE_STATUS_LABELS, quoteStatusLabel } from "@/lib/status-labels";

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

type SortKey = "createdAt" | "amount" | "status" | "prospect" | "title";
type SortDirection = "asc" | "desc";
type DisplayFilter = "ACTIVE" | "CLOSED" | "EXPIRED" | "ALL";

const DISPLAY_FILTERS: { value: DisplayFilter; label: string }[] = [
  { value: "ACTIVE", label: "Actifs" },
  { value: "CLOSED", label: "Clôturés" },
  { value: "EXPIRED", label: "Expirés" },
  { value: "ALL", label: "Tous" },
];

const ACTIVE_QUOTE_STATUSES = ["DRAFT", "SENT"];
const CLOSED_QUOTE_STATUSES = ["ACCEPTED", "REJECTED", "CANCELLED"];

function matchesDisplayFilter(status: string, displayFilter: DisplayFilter) {
  if (displayFilter === "ALL") return true;
  if (displayFilter === "ACTIVE") return ACTIVE_QUOTE_STATUSES.includes(status);
  if (displayFilter === "CLOSED") return CLOSED_QUOTE_STATUSES.includes(status);
  return status === "EXPIRED";
}

function quoteSearchText(quote: Quote) {
  return [
    quote.quoteNumber,
    quote.title,
    quote.status,
    quoteStatusLabel(quote.status),
    quote.prospect.name,
    quote.prospect.company,
    quote.prospect.email,
    quote.prospect.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function prospectDisplayName(quote: Quote) {
  return quote.prospect.company ?? quote.prospect.name;
}

function quoteCountLabel(count: number) {
  return `${count} devis affiché${count > 1 ? "s" : ""}`;
}

function emptyQuotesMessage(displayFilter: DisplayFilter) {
  if (displayFilter === "ACTIVE") {
    return "Aucun devis actif trouvé.";
  }

  if (displayFilter === "CLOSED") {
    return "Aucun devis clôturé trouvé.";
  }

  if (displayFilter === "EXPIRED") {
    return "Aucun devis expiré trouvé.";
  }

  return "Aucun devis trouvé.";
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayFilter, setDisplayFilter] = useState<DisplayFilter>("ACTIVE");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
    const query = searchQuery.trim().toLowerCase();

    const filtered = quotes.filter((quote) => {
      const matchesDisplay = matchesDisplayFilter(quote.status, displayFilter);

      const matchesStatus =
        statusFilter === "ALL" || quote.status === statusFilter;

      const matchesSearch = !query || quoteSearchText(quote).includes(query);

      return matchesDisplay && matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      let result = 0;

      if (sortKey === "createdAt") {
        result =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (sortKey === "amount") {
        result = a.totalAmount - b.totalAmount;
      }

      if (sortKey === "status") {
        result = compareText(
          quoteStatusLabel(a.status),
          quoteStatusLabel(b.status)
        );
      }

      if (sortKey === "prospect") {
        result = compareText(prospectDisplayName(a), prospectDisplayName(b));
      }

      if (sortKey === "title") {
        result = compareText(a.title, b.title);
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [displayFilter, quotes, searchQuery, sortDirection, sortKey, statusFilter]);

  const totalAmount = filteredQuotes.reduce((sum, quote) => {
    return sum + quote.totalAmount;
  }, 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "createdAt" || key === "amount" ? "desc" : "asc");
  }

  function sortLabel(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Devis affichés</p>
          <p className="mt-2 text-3xl font-semibold">{filteredQuotes.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            sur {quotes.length} au total
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Montant affiché</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatAmount(totalAmount)}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Affichage</p>
          <select
            value={displayFilter}
            onChange={(event) =>
              setDisplayFilter(event.target.value as DisplayFilter)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {DISPLAY_FILTERS.map((filter) => (
              <option
                key={filter.value}
                value={filter.value}
              >
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Filtre statut</p>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(QUOTE_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-5 lg:grid-cols-[1fr_220px_180px]">
        <div>
          <label className="text-sm font-medium">Recherche</label>
          <div className="mt-2 flex items-center gap-2 rounded-md border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Numéro, titre, prospect, société, email..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Trier par</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="createdAt">Date de création</option>
            <option value="amount">Montant</option>
            <option value="status">Statut</option>
            <option value="prospect">Prospect</option>
            <option value="title">Titre</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Ordre</label>
          <select
            value={sortDirection}
            onChange={(event) =>
              setSortDirection(event.target.value as SortDirection)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {quoteCountLabel(filteredQuotes.length)}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && filteredQuotes.length === 0 && (
        <div className="rounded-lg border bg-card px-5 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {emptyQuotesMessage(displayFilter)}
          </p>
        </div>
      )}

      {!loading && !error && filteredQuotes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Numéro</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("title")}
                    className="hover:underline"
                  >
                    Titre{sortLabel("title")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("prospect")}
                    className="hover:underline"
                  >
                    Prospect{sortLabel("prospect")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("amount")}
                    className="hover:underline"
                  >
                    Montant{sortLabel("amount")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="hover:underline"
                  >
                    Statut{sortLabel("status")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    className="hover:underline"
                  >
                    Créé le{sortLabel("createdAt")}
                  </button>
                </th>
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
                      {prospectDisplayName(quote)}
                    </Link>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatAmount(quote.totalAmount, quote.currency)}
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {quoteStatusLabel(quote.status)}
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
