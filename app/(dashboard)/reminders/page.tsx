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

function statusTone(status: string) {
  switch (status) {
    case "APPROVED":
    case "SENT":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "SCHEDULED":
      return "bg-[#e3eef3] text-[#2f6f8f]";
    case "DRAFT":
    case "PENDING_APPROVAL":
      return "bg-[#faf0df] text-[#9a6a1e]";
    case "CANCELLED":
      return "bg-[#eef1ef] text-muted-foreground";
    case "FAILED":
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
      {reminderDisplayStatus(status)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "green" | "red";
}) {
  const toneClass = {
    amber: "text-[#d68a2e]",
    blue: "text-[#2f6f8f]",
    green: "text-primary",
    red: "text-destructive",
  }[tone];

  return (
    <div className="border-l-2 border-l-input pl-3.5">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-[30px] font-bold leading-none ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-5 py-10 text-center text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
      {message}
    </div>
  );
}

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

  return (
    <section className="space-y-[22px]">
      <div className="flex items-center justify-between gap-4">
        {!loading && !error ? (
          <p className="text-[13px] font-medium text-muted-foreground">
            {reminderCountLabel(filteredRows.length)} sur {rows.length} au total
          </p>
        ) : <span />}
        <button
          type="button"
          onClick={loadReminders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-[11px] border border-input bg-card px-4 py-2.5 text-sm font-semibold shadow-[var(--surface-shadow)] transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card px-6 py-[22px] shadow-[var(--surface-shadow)]">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_190px] lg:items-center">
          <MetricCard label="À approuver" value={pendingApprovalCount} tone="amber" />
          <MetricCard label="Programmées" value={scheduledCount} tone="blue" />
          <MetricCard label="Envoyées" value={sentCount} tone="green" />
          <MetricCard label="Échec" value={failedCount} tone="red" />
          <div>
          <p className="text-[13px] font-medium text-muted-foreground">
            Affichage
          </p>
          <select
            value={displayFilter}
            onChange={(event) =>
              setDisplayFilter(event.target.value as DisplayFilter)
            }
            className="mt-2 w-full rounded-[11px] border border-input bg-card px-[13px] py-[11px] text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]"
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
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card px-5 py-[22px] shadow-[var(--surface-shadow)] lg:grid-cols-[1fr_190px_190px_160px]">
        <div>
          <label className="text-[13px] font-semibold">Recherche</label>
          <div className="mt-[7px] flex items-center gap-2 rounded-[11px] border border-input bg-card px-[13px] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-[hsl(var(--emerald-soft))]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sujet, message, statut, prospect, société, devis..."
              className="w-full bg-transparent py-[11px] text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Statut</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-[7px] w-full rounded-[11px] border border-input bg-card px-[13px] py-[11px] text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]"
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
          <label className="text-[13px] font-semibold">Trier par</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="mt-[7px] w-full rounded-[11px] border border-input bg-card px-[13px] py-[11px] text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]"
          >
            <option value="createdAt">Date de création</option>
            <option value="status">Statut</option>
            <option value="prospect">Prospect</option>
            <option value="quote">Devis</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Ordre</label>
          <select
            value={sortDirection}
            onChange={(event) =>
              setSortDirection(event.target.value as SortDirection)
            }
            className="mt-[7px] w-full rounded-[11px] border border-input bg-card px-[13px] py-[11px] text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))]"
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-2xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] p-4 text-sm font-medium text-primary">
          {success}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-[var(--surface-shadow)]">
          Chargement…
        </div>
      ) : rows.length === 0 ? (
        <EmptyPanel message="Aucune relance pour l'instant." />
      ) : filteredRows.length === 0 ? (
        <EmptyPanel message={emptyRemindersMessage(displayFilter)} />
      ) : (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <article
              key={row.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]"
            >
              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={row.status} />
                    <span className="text-xs text-muted-foreground">
                      Créée le {formatDate(row.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[17px] font-bold">{row.subject}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
                    <span>
                      Prospect :{" "}
                      {row.prospect ? (
                        <Link
                          href={`/prospects/${row.prospect.id}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {prospectDisplayName(row)}
                        </Link>
                      ) : "—"}
                    </span>
                    <span>
                      Devis :{" "}
                      {row.quote ? (
                        <Link
                          href={`/quotes/${row.quote.id}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {quoteDisplayName(row)}
                        </Link>
                      ) : "—"}
                    </span>
                    <span>
                      Programmation :{" "}
                      <strong className="font-semibold text-foreground">
                        {row.scheduledAt
                          ? formatScheduledDateTime(row.scheduledAt)
                          : "Non programmée"}
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-[250px] lg:justify-end">
                          {row.status === "SCHEDULED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => startSchedulingReminder(row)}
                                disabled={actionId === row.id}
                                className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-input bg-card px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-50"
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                                Modifier
                              </button>

                              <button
                                type="button"
                                onClick={() => cancelScheduledReminder(row.id)}
                                disabled={actionId === row.id}
                                className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-input bg-card px-3 py-2 text-xs font-semibold text-destructive hover:border-destructive disabled:opacity-50"
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
                              className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-input bg-card px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-50"
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
                              className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
                              className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                              {actionId === row.id
                                ? "Réessai…"
                                : "Réessayer"}
                            </button>
                          )}
                </div>
              </div>

              <div className="border-t bg-[hsl(var(--emerald-tint))]/35 px-5 py-4">
                {row.status === "FAILED" && (
                  <p className="mb-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
                    Échec d’envoi. Cette relance ne sera pas renvoyée
                    automatiquement.
                  </p>
                )}
                {schedulingReminderId === row.id && (
                  <div className="mb-3 rounded-xl border border-border bg-[hsl(var(--emerald-tint))]/55 p-3">
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
                        className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[hsl(var(--emerald-soft))]"
                      />
                      <button
                        type="button"
                        onClick={() => updateScheduledReminder(row.id)}
                        disabled={actionId === row.id}
                        className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={cancelSchedulingReminder}
                        disabled={actionId === row.id}
                        className="rounded-xl border bg-card px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-50 sm:w-auto"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  Contenu de la relance
                </p>
                <div className="whitespace-pre-line rounded-xl border border-border bg-card p-4 text-sm leading-6 text-[#364740]">
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
