"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prospects</h1>
          {!loading && !error && (
            <p className="mt-2 text-sm text-muted-foreground">
              {filteredProspects.length} prospect
              {filteredProspects.length > 1 ? "s" : ""} affiché
              {filteredProspects.length > 1 ? "s" : ""} ·{" "}
              {DISPLAY_FILTER_LABELS[displayFilter].toLowerCase()}
            </p>
          )}
        </div>
        <Link
          href="/prospects/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nouveau prospect
        </Link>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-5 lg:grid-cols-[1fr_160px_180px_180px_180px]">
        <div>
          <label className="text-sm font-medium">Recherche</label>
          <div className="mt-2 flex items-center gap-2 rounded-md border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nom, société, email, téléphone, statut..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Affichage</label>
          <select
            value={displayFilter}
            onChange={(event) =>
              setDisplayFilter(event.target.value as DisplayFilter)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ACTIVE">Actifs</option>
            <option value="ARCHIVED">Archivés</option>
            <option value="ALL">Tous</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Statut</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
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
          <label className="text-sm font-medium">Trier par</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="createdAt">Date de création</option>
            <option value="name">Nom</option>
            <option value="company">Société</option>
            <option value="status">Statut</option>
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

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && prospects.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun prospect pour l&apos;instant.
        </p>
      )}

      {hasNoFilteredProspects && (
        <p className="rounded-lg border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          {emptyFilteredMessage}
        </p>
      )}

      {!loading && !error && filteredProspects.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="hover:underline"
                  >
                    Nom{sortLabel("name")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("company")}
                    className="hover:underline"
                  >
                    Société{sortLabel("company")}
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="hover:underline"
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
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {prospectStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(p.createdAt)}
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
