"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  RefreshCw,
  Search,
  Send,
  RotateCw,
  X,
} from "lucide-react";
import {
  compareText,
  formatDate,
  formatScheduledDateTime,
} from "@/lib/formatters";
import {
  REMINDER_STATUS_LABELS,
  reminderStatusLabel,
} from "@/lib/status-labels";

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
type DisplayFilter = "ACTIONABLE" | "SCHEDULED" | "SENT" | "FAILED" | "ALL";

const DISPLAY_FILTERS: { value: DisplayFilter; label: string }[] = [
  { value: "ACTIONABLE", label: "À traiter" },
  { value: "SCHEDULED", label: "Programmées" },
  { value: "SENT", label: "Envoyées" },
  { value: "FAILED", label: "Échec" },
  { value: "ALL", label: "Toutes" },
];

const ACTIONABLE_REMINDER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
];

function matchesDisplayFilter(status: string, displayFilter: DisplayFilter) {
  if (displayFilter === "ALL") return true;
  if (displayFilter === "ACTIONABLE") {
    return ACTIONABLE_REMINDER_STATUSES.includes(status);
  }

  return status === displayFilter;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

async function getApiErrorMessage(
  res: Response,
  fallbackMessage: string
): Promise<string> {
  const json = await res.json().catch(() => ({}));
  return (json as { error?: string }).error ?? fallbackMessage;
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

function reminderCountLabel(count: number) {
  return `${count} relance${count > 1 ? "s" : ""} affichée${
    count > 1 ? "s" : ""
  }`;
}

function emptyRemindersMessage(displayFilter: DisplayFilter) {
  if (displayFilter === "ACTIONABLE") {
    return "Aucune relance à traiter ne correspond aux filtres.";
  }

  if (displayFilter === "SCHEDULED") {
    return "Aucune relance programmée ne correspond aux filtres.";
  }

  if (displayFilter === "SENT") {
    return "Aucune relance envoyée ne correspond aux filtres.";
  }

  if (displayFilter === "FAILED") {
    return "Aucune relance en échec ne correspond aux filtres.";
  }

  return "Aucune relance ne correspond aux filtres.";
}

function inputDateTimeValue(date: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function RemindersPage() {
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayFilter, setDisplayFilter] =
    useState<DisplayFilter>("ACTIONABLE");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [schedulingReminderId, setSchedulingReminderId] = useState<
    string | null
  >(null);
  const [scheduleReminderDate, setScheduleReminderDate] = useState("");

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

    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId }),
      });

      if (!res.ok) {
        setError(await getApiErrorMessage(res, "Erreur lors de l'envoi"));
        return;
      }

      await loadReminders();
      setSuccess(isRetry ? "Relance renvoyée" : "Relance envoyée");
    } catch {
      setError(
        "Erreur réseau : impossible de contacter le serveur pour envoyer la relance."
      );
    } finally {
      setActionId(null);
    }
  }

  function startSchedulingReminder(reminder: ReminderRow) {
    setSchedulingReminderId(reminder.id);
    setScheduleReminderDate(inputDateTimeValue(reminder.scheduledAt));
    setError(null);
    setSuccess(null);
  }

  function cancelSchedulingReminder() {
    setSchedulingReminderId(null);
    setScheduleReminderDate("");
  }

  async function updateScheduledReminder(reminderId: string) {
    if (!scheduleReminderDate) {
      setError("Choisissez une date et une heure de programmation.");
      return;
    }

    const scheduledAt = new Date(scheduleReminderDate);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("La date de programmation est invalide.");
      return;
    }

    setActionId(reminderId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SCHEDULED",
          scheduledAt: scheduledAt.toISOString(),
        }),
      });

      if (!res.ok) {
        setError(
          await getApiErrorMessage(
            res,
            "Erreur lors de la modification de la programmation"
          )
        );
        return;
      }

      cancelSchedulingReminder();
      await loadReminders();
      setSuccess("Programmation mise à jour");
    } catch {
      setError(
        "Erreur réseau : impossible de modifier la programmation de la relance."
      );
    } finally {
      setActionId(null);
    }
  }

  async function cancelScheduledReminder(reminderId: string) {
    setActionId(reminderId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", scheduledAt: null }),
      });

      if (!res.ok) {
        setError(
          await getApiErrorMessage(
            res,
            "Erreur lors de l'annulation de la programmation"
          )
        );
        return;
      }

      if (schedulingReminderId === reminderId) {
        cancelSchedulingReminder();
      }

      await loadReminders();
      setSuccess("Programmation annulée. La relance reste approuvée.");
    } catch {
      setError(
        "Erreur réseau : impossible d'annuler la programmation de la relance."
      );
    } finally {
      setActionId(null);
    }
  }

  const pendingApprovalCount = useMemo(
    () => rows.filter((row) => row.status === "PENDING_APPROVAL").length,
    [rows]
  );

  const scheduledCount = useMemo(
    () => rows.filter((row) => row.status === "SCHEDULED").length,
    [rows]
  );

  const sentCount = useMemo(
    () => rows.filter((row) => row.status === "SENT").length,
    [rows]
  );

  const failedCount = useMemo(
    () => rows.filter((row) => row.status === "FAILED").length,
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      const matchesDisplay = matchesDisplayFilter(row.status, displayFilter);
      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter;
      const matchesSearch = !query || reminderSearchText(row).includes(query);

      return matchesDisplay && matchesStatus && matchesSearch;
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
  }, [
    displayFilter,
    rows,
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">À approuver</p>
          <p className="mt-2 text-3xl font-semibold">{pendingApprovalCount}</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Programmées</p>
          <p className="mt-2 text-3xl font-semibold">{scheduledCount}</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Envoyées</p>
          <p className="mt-2 text-3xl font-semibold">{sentCount}</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Échec</p>
          <p className="mt-2 text-3xl font-semibold">{failedCount}</p>
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
            {Object.entries(REMINDER_STATUS_LABELS).map(([status, label]) => (
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
      {success && (
        <p className="rounded-md border border-emerald-600/30 bg-emerald-50 p-3 text-sm text-emerald-900">
          {success}
        </p>
      )}

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {reminderCountLabel(filteredRows.length)} sur {rows.length} au total.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border bg-card px-5 py-8 text-sm text-muted-foreground">
          Aucune relance pour l&apos;instant.
        </p>
      ) : filteredRows.length === 0 ? (
        <p className="rounded-lg border bg-card px-5 py-8 text-sm text-muted-foreground">
          {emptyRemindersMessage(displayFilter)}
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
                      <th className="px-4 py-3 font-medium">Approuvée le</th>
                      <th className="px-4 py-3 font-medium">Programmation</th>
                      <th className="px-4 py-3 font-medium">Envoyée le</th>
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
                        {row.scheduledAt
                          ? formatScheduledDateTime(row.scheduledAt)
                          : "Non programmée"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.sentAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {row.status === "SCHEDULED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => startSchedulingReminder(row)}
                                disabled={actionId === row.id}
                                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                                Modifier
                              </button>

                              <button
                                type="button"
                                onClick={() => cancelScheduledReminder(row.id)}
                                disabled={actionId === row.id}
                                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-muted disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                                Annuler
                              </button>
                            </>
                          )}

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
                    Échec d’envoi. Cette relance ne sera pas renvoyée
                    automatiquement.
                  </p>
                )}
                {schedulingReminderId === row.id && (
                  <div className="mb-3 rounded-md border bg-muted/30 p-3">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Programmer pour
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="datetime-local"
                        value={scheduleReminderDate}
                        onChange={(event) =>
                          setScheduleReminderDate(event.target.value)
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => updateScheduledReminder(row.id)}
                        disabled={actionId === row.id}
                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={cancelSchedulingReminder}
                        disabled={actionId === row.id}
                        className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
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
