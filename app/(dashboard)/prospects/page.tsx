"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, UserRound } from "lucide-react";
import { compareText, formatDate } from "@/lib/formatters";
import {
  PROSPECT_STATUS_LABELS,
  prospectStatusLabel,
} from "@/lib/status-labels";

type Prospect = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  createdAt: string;
};

type SortKey = "name" | "company" | "status" | "createdAt";
type SortDirection = "asc" | "desc";
type DisplayFilter = "ACTIVE" | "ARCHIVED" | "ALL";

const DISPLAY_FILTER_LABELS: Record<DisplayFilter, string> = {
  ACTIVE: "Actifs",
  ARCHIVED: "Archivés",
  ALL: "Tous",
};

const filterSelectClass =
  "h-[44px] w-full rounded-full border border-input bg-card px-4 text-sm shadow-[var(--surface-shadow)] outline-none transition focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]";

function statusTone(status: string) {
  switch (status) {
    case "CONTACTED":
      return "bg-[#e3eef3] text-[#2f6f8f]";
    case "QUALIFIED":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "WON":
      return "bg-primary text-primary-foreground";
    case "LOST":
      return "bg-[#fbeceb] text-destructive";
    case "ARCHIVED":
      return "bg-[#eef1ef] text-muted-foreground";
    case "NEW":
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
      {prospectStatusLabel(status)}
    </span>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-5 py-12 text-center shadow-[var(--surface-shadow)]">
      <span className="mx-auto grid h-[46px] w-[46px] place-items-center rounded-[13px] border border-[hsl(var(--emerald-soft))] bg-card text-primary">
        <UserRound className="h-[22px] w-[22px]" />
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function prospectSearchText(prospect: Prospect) {
  return [
    prospect.name,
    prospect.company,
    prospect.email,
    prospect.phone,
    prospect.status,
    prospectStatusLabel(prospect.status),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayFilter, setDisplayFilter] =
    useState<DisplayFilter>("ACTIVE");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  const filteredProspects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = prospects.filter((prospect) => {
      const matchesDisplay =
        displayFilter === "ALL" ||
        (displayFilter === "ACTIVE" && prospect.status !== "ARCHIVED") ||
        (displayFilter === "ARCHIVED" && prospect.status === "ARCHIVED");
      const matchesStatus =
        statusFilter === "ALL" || prospect.status === statusFilter;
      const matchesSearch =
        !query || prospectSearchText(prospect).includes(query);

      return matchesDisplay && matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      let result = 0;

      if (sortKey === "name") {
        result = compareText(a.name, b.name);
      }

      if (sortKey === "company") {
        result = compareText(a.company, b.company);
      }

      if (sortKey === "status") {
        result = compareText(
          prospectStatusLabel(a.status),
          prospectStatusLabel(b.status)
        );
      }

      if (sortKey === "createdAt") {
        result =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [
    displayFilter,
    prospects,
    searchQuery,
    sortDirection,
    sortKey,
    statusFilter,
  ]);

  const hasNoFilteredProspects =
    !loading &&
    !error &&
    prospects.length > 0 &&
    filteredProspects.length === 0;

  const emptyFilteredMessage =
    displayFilter === "ACTIVE"
      ? "Aucun prospect actif ne correspond à vos filtres."
      : displayFilter === "ARCHIVED"
        ? "Aucun prospect archivé ne correspond à vos filtres."
        : "Aucun prospect ne correspond à vos filtres.";

  return (
    <section className="space-y-[22px]">
      {!loading && !error && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] font-medium text-muted-foreground">
            {filteredProspects.length} prospect
            {filteredProspects.length > 1 ? "s" : ""} affiché
            {filteredProspects.length > 1 ? "s" : ""} ·{" "}
            {DISPLAY_FILTER_LABELS[displayFilter].toLowerCase()}
          </p>
        </div>
      )}

      <div className="grid gap-4 rounded-2xl border border-border bg-card px-5 py-[22px] shadow-[var(--surface-shadow)] sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_150px_190px_180px_150px]">
        <div>
          <label className="text-[13px] font-semibold">Recherche</label>
          <div className="mt-[7px] flex h-[44px] items-center gap-2 rounded-full border border-input bg-card px-4 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-[hsl(var(--emerald-soft))]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nom, société, email, téléphone, statut..."
              className="w-full bg-transparent py-[11px] text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Affichage</label>
          <select
            value={displayFilter}
            onChange={(event) =>
              setDisplayFilter(event.target.value as DisplayFilter)
            }
            className={`mt-[7px] ${filterSelectClass}`}
          >
            <option value="ACTIVE">Actifs</option>
            <option value="ARCHIVED">Archivés</option>
            <option value="ALL">Tous</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Statut</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`mt-[7px] ${filterSelectClass}`}
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(PROSPECT_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Trier par</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className={`mt-[7px] ${filterSelectClass}`}
          >
            <option value="createdAt">Date de création</option>
            <option value="name">Nom</option>
            <option value="company">Société</option>
            <option value="status">Statut</option>
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

      {!loading && !error && prospects.length === 0 && (
        <EmptyPanel message="Aucun prospect pour l'instant." />
      )}

      {hasNoFilteredProspects && <EmptyPanel message={emptyFilteredMessage} />}

      {!loading && !error && filteredProspects.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredProspects.map((p) => (
            <Link
              key={p.id}
              href={`/prospects/${p.id}`}
              className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] transition hover:-translate-y-0.5 hover:border-[hsl(var(--emerald-soft))] hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.22)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{p.name}</p>
                  <p className="mt-1 truncate text-[13px] text-muted-foreground">
                    {p.company ?? "Particulier"}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-5 space-y-1.5 text-[13px] text-muted-foreground">
                <p className="truncate">{p.email ?? "Email non renseigné"}</p>
                <p>{p.phone ?? "Téléphone non renseigné"}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Créé le {formatDate(p.createdAt)}</span>
                <ArrowUpRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
