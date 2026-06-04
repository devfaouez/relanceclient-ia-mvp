"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Search } from "lucide-react";
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

const filterSelectClass =
  "h-[44px] w-full rounded-[11px] border border-input bg-card px-[13px] text-sm shadow-[var(--surface-shadow)] outline-none transition focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]";

function statusTone(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "SENT":
      return "bg-[#faf0df] text-[#9a6a1e]";
    case "DRAFT":
    case "CANCELLED":
      return "bg-[#eef1ef] text-muted-foreground";
    case "EXPIRED":
    case "REJECTED":
      return "bg-[#fbeceb] text-destructive";
    default:
      return "bg-[#eef1ef] text-muted-foreground";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(
        status,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {quoteStatusLabel(status)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  accent = false,
}: {
  label: string;
  value: string | number;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <div className="min-h-[124px] rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-2 truncate text-[32px] font-bold leading-none tracking-normal ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
      {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

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

  return (
    <section className="space-y-[22px]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Devis affichés"
          value={filteredQuotes.length}
          helper={`sur ${quotes.length} au total`}
        />

        <MetricCard
          label="Montant affiché"
          value={formatAmount(totalAmount)}
          accent
        />

        <div className="min-h-[124px] rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
          <p className="text-[13px] font-medium text-muted-foreground">
            Affichage
          </p>
          <select
            value={displayFilter}
            onChange={(event) =>
              setDisplayFilter(event.target.value as DisplayFilter)
            }
            className={`mt-2 ${filterSelectClass}`}
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

        <div className="min-h-[124px] rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
          <p className="text-[13px] font-medium text-muted-foreground">
            Filtre statut
          </p>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`mt-2 ${filterSelectClass}`}
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

      <div className="grid gap-4 rounded-2xl border border-border bg-card px-5 py-[22px] shadow-[var(--surface-shadow)] sm:grid-cols-2 lg:grid-cols-[minmax(300px,1fr)_190px_150px]">
        <div>
          <label className="text-[13px] font-semibold">Recherche</label>
          <div className="mt-[7px] flex items-center gap-2 rounded-[11px] border border-input bg-card px-[13px] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-[hsl(var(--emerald-soft))]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Numéro, titre, prospect, société, email..."
              className="w-full bg-transparent py-[11px] text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Trier par</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className={`mt-[7px] ${filterSelectClass}`}
          >
            <option value="createdAt">Date de création</option>
            <option value="amount">Montant</option>
            <option value="status">Statut</option>
            <option value="prospect">Prospect</option>
            <option value="title">Titre</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Ordre</label>
          <select
            value={sortDirection}
            onChange={(event) =>
              setSortDirection(event.target.value as SortDirection)
            }
            className={`mt-[7px] ${filterSelectClass}`}
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      {!loading && !error && (
        <p className="text-sm font-medium text-muted-foreground">
          {quoteCountLabel(filteredQuotes.length)}
        </p>
      )}

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
          Chargement…
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && filteredQuotes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-5 py-10 text-center shadow-[var(--surface-shadow)]">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-card text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            {emptyQuotesMessage(displayFilter)}
          </p>
        </div>
      )}

      {!loading && !error && filteredQuotes.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredQuotes.map((quote) => (
            <article
              key={quote.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] transition hover:border-[hsl(var(--emerald-soft))] hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.22)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {quote.quoteNumber ?? "Sans numéro"}
                  </p>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="mt-1 block truncate text-[16px] font-bold hover:text-primary"
                  >
                    {quote.title}
                  </Link>
                </div>
                <StatusBadge status={quote.status} />
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Prospect associé</p>
                  <Link
                    href={`/prospects/${quote.prospect.id}`}
                    className="mt-1 block truncate text-sm font-semibold hover:text-primary"
                  >
                    {prospectDisplayName(quote)}
                  </Link>
                </div>
                <p className="shrink-0 text-[24px] font-bold leading-none text-primary">
                  {formatAmount(quote.totalAmount, quote.currency)}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Créé le {formatDate(quote.createdAt)}</span>
                <span>Validité : {formatDate(quote.validUntil)}</span>
                <Link href={`/quotes/${quote.id}`} aria-label={`Voir ${quote.title}`}>
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
