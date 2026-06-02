"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
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

function statusTone(status: string) {
  switch (status) {
    case "CONTACTED":
      return "bg-sky-50 text-sky-700";
    case "QUALIFIED":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "WON":
      return "bg-primary text-primary-foreground";
    case "LOST":
      return "bg-red-50 text-red-700";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-600";
    case "NEW":
    default:
      return "bg-slate-100 text-slate-600";
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
    <div className="rounded-2xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-5 py-10 text-center text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
      {message}
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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "createdAt" ? "desc" : "asc");
  }

  function sortLabel(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

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
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Pilotage
          </p>
          <h1 className="mt-1 text-2xl font-bold">Prospects</h1>
          {!loading && !error && (
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {filteredProspects.length} prospect
              {filteredProspects.length > 1 ? "s" : ""} affiché
              {filteredProspects.length > 1 ? "s" : ""} ·{" "}
              {DISPLAY_FILTER_LABELS[displayFilter].toLowerCase()}
            </p>
          )}
        </div>
        <Link
          href="/prospects/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--surface-shadow)] hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouveau prospect
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] lg:grid-cols-[1fr_160px_180px_180px_180px]">
        <div>
          <label className="text-[13px] font-semibold">Recherche</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-[hsl(var(--emerald-soft))]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nom, société, email, téléphone, statut..."
              className="w-full bg-transparent py-2.5 text-sm outline-none"
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
            className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]"
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
            className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]"
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
            className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]"
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
            className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]"
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
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[hsl(var(--emerald-tint))] text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="hover:text-primary/80"
                  >
                    Nom{sortLabel("name")}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Téléphone
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  <button
                    type="button"
                    onClick={() => toggleSort("company")}
                    className="hover:text-primary/80"
                  >
                    Société{sortLabel("company")}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="hover:text-primary/80"
                  >
                    Statut{sortLabel("status")}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    className="hover:text-primary/80"
                  >
                    Créé le{sortLabel("createdAt")}
                  </button>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b transition last:border-0 hover:bg-[hsl(var(--emerald-tint))]/70"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {p.name}
                    </Link>
                  </td>
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
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
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
