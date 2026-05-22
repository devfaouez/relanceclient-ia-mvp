"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, RefreshCw, Search, Send, RotateCw } from "lucide-react";
import {
  compareText,
  formatDate,
  formatScheduledDateTime,
} from "@/lib/formatters";
import { reminderStatusLabel } from "@/lib/status-labels";

type Reminder = {
  id: string;
  quoteId: string;
  subject: string;
  body: string;
  status: string;
  approvedAt: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

type Quote = {
  id: string;
  prospectId: string;
  title: string;
  quoteNumber: string | null;
};

type Prospect = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
};

type ReminderRow = Reminder & {
  quote: Quote | null;
  prospect: Prospect | null;
};

type SortKey = "createdAt" | "status" | "prospect" | "quote";
type SortDirection = "asc" | "desc";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

function quoteDisplayName(row: ReminderRow) {
  if (!row.quote) return "";
  return row.quote.quoteNumber
    ? `${row.quote.title} #${row.quote.quoteNumber}`
    : row.quote.title;
}

function prospectDisplayName(row: ReminderRow) {
  if (!row.prospect) return "";
  return row.prospect.company ?? row.prospect.name;
}

function reminderSearchText(row: ReminderRow) {
  return [
    row.subject,
    row.body,
    row.status,
    reminderStatusLabel(row.status),
    row.prospect?.name,
    row.prospect?.company,
    row.quote?.title,
    row.quote?.quoteNumber,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function reminderDisplayStatus(status: string) {
  return status === "FAILED" ? "Échec d’envoi" : reminderStatusLabel(status);
}

export default function RemindersPage() {
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const reminders = await fetchJson<Reminder[]>("/api/reminders");
      if (!reminders) {
        throw new Error("Erreur lors du chargement des relances");
      }

      const quoteEntries = await Promise.all(
        Array.from(new Set(reminders.map((reminder) => reminder.quoteId))).map(
          async (quoteId) => [quoteId, await fetchJson<Quote>(`/api/quotes/${quoteId}`)] as const
        )
      );
      const quoteById = new Map(quoteEntries);

      const prospectEntries = await Promise.all(
        Array.from(
          new Set(
            quoteEntries
              .map(([, quote]) => quote?.prospectId)
              .filter((id): id is string => Boolean(id))
          )
        ).map(
          async (prospectId) =>
            [prospectId, await fetchJson<Prospect>(`/api/prospects/${prospectId}`)] as const
        )
      );
      const prospectById = new Map(prospectEntries);

      setRows(
        reminders.map((reminder) => {
          const quote = quoteById.get(reminder.quoteId) ?? null;
          const prospect = quote
            ? prospectById.get(quote.prospectId) ?? null
            : null;

          return { ...reminder, quote, prospect };
        })
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors du chargement des relances"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  async function approveReminder(reminderId: string) {
    setActionId(reminderId);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    setActionId(null);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(
        (json as { error?: string }).error ?? "Erreur lors de l'approbation"
      );
      return;
    }

    await loadReminders();
  }

  async function sendReminder(reminderId: string) {
    const reminder = rows.find((row) => row.id === reminderId);
    const isRetry = reminder?.status === "FAILED";

    setActionId(reminderId);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/reminders/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId }),
    });

    setActionId(null);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? "Erreur lors de l'envoi");
      return;
    }

    await loadReminders();
    setSuccess(isRetry ? "Relance renvoyée" : "Relance envoyée");
  }

  const pendingCount = useMemo(
    () => rows.filter((row) => row.status === "PENDING_APPROVAL").length,
    [rows]
  );

  const statuses = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.status))).sort((a, b) =>
        compareText(reminderStatusLabel(a), reminderStatusLabel(b))
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter;
      const matchesSearch = !query || reminderSearchText(row).includes(query);

      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      let result = 0;

      if (sortKey === "createdAt") {
        result =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (sortKey === "status") {
        result = compareText(
          reminderStatusLabel(a.status),
          reminderStatusLabel(b.status)
        );
      }

      if (sortKey === "prospect") {
        result = compareText(prospectDisplayName(a), prospectDisplayName(b));
      }

      if (sortKey === "quote") {
        result = compareText(quoteDisplayName(a), quoteDisplayName(b));
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [rows, searchQuery, sortDirection, sortKey, statusFilter]);

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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Relances</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune relance ne peut être envoyée sans approbation humaine.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReminders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </button>
      </div>

      <div className="rounded-lg border bg-card px-5 py-4">
        <p className="text-sm text-muted-foreground">
          {rows.length} relance{rows.length > 1 ? "s" : ""} au total, dont{" "}
          <span className="font-medium text-foreground">{pendingCount}</span> à
          approuver.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {filteredRows.length}
          </span>{" "}
          relance{filteredRows.length > 1 ? "s" : ""} affichée
          {filteredRows.length > 1 ? "s" : ""}.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-5 lg:grid-cols-[1fr_220px_220px_180px]">
        <div>
          <label className="text-sm font-medium">Recherche</label>
          <div className="mt-2 flex items-center gap-2 rounded-md border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sujet, message, statut, prospect, société, devis..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Statut</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">Tous les statuts</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {reminderStatusLabel(status)}
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
            <option value="status">Statut</option>
            <option value="prospect">Prospect</option>
            <option value="quote">Devis</option>
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

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-muted-foreground">{success}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border bg-card px-5 py-8 text-sm text-muted-foreground">
          Aucune relance pour l&apos;instant.
        </p>
      ) : filteredRows.length === 0 ? (
        <p className="rounded-lg border bg-card px-5 py-8 text-sm text-muted-foreground">
          Aucune relance ne correspond aux filtres.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <article key={row.id} className="rounded-lg border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium">Sujet</th>
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
                          onClick={() => toggleSort("quote")}
                          className="hover:underline"
                        >
                          Devis{sortLabel("quote")}
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
                          Créée le{sortLabel("createdAt")}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">approvedAt</th>
                      <th className="px-4 py-3 font-medium">Programmation</th>
                      <th className="px-4 py-3 font-medium">sentAt</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="min-w-48 px-4 py-3 font-medium">
                        {row.subject}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.prospect ? (
                          <Link
                            href={`/prospects/${row.prospect.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {row.prospect.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="min-w-40 px-4 py-3 text-muted-foreground">
                        {row.quote ? (
                          <Link
                            href={`/quotes/${row.quote.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {row.quote.title}
                            {row.quote.quoteNumber
                              ? ` #${row.quote.quoteNumber}`
                              : ""}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          {reminderDisplayStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.approvedAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatScheduledDateTime(row.scheduledAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.sentAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {row.status === "PENDING_APPROVAL" && (
                            <button
                              type="button"
                              onClick={() => approveReminder(row.id)}
                              disabled={actionId === row.id}
                              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approuver
                            </button>
                          )}

                          {row.status === "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => sendReminder(row.id)}
                              disabled={actionId === row.id}
                              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Envoyer
                            </button>
                          )}

                          {row.status === "FAILED" && (
                            <button
                              type="button"
                              onClick={() => sendReminder(row.id)}
                              disabled={actionId === row.id}
                              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                              {actionId === row.id
                                ? "Réessai…"
                                : "Réessayer"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t px-4 py-4">
                {row.status === "FAILED" && (
                  <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    Échec d’envoi
                  </p>
                )}
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Contenu de la relance
                </p>
                <div className="whitespace-pre-line rounded-md bg-muted/50 p-4 text-sm leading-6">
                  {row.body}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
