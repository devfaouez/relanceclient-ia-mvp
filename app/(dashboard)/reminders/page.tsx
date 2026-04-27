"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, RefreshCw, Send } from "lucide-react";

type Reminder = {
  id: string;
  quoteId: string;
  subject: string;
  body: string;
  status: string;
  approvedAt: string | null;
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

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: string | null) {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export default function RemindersPage() {
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setActionId(reminderId);
    setError(null);

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
  }

  const pendingCount = useMemo(
    () => rows.filter((row) => row.status === "PENDING_APPROVAL").length,
    [rows]
  );

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
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border bg-card px-5 py-8 text-sm text-muted-foreground">
          Aucune relance pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <article key={row.id} className="rounded-lg border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium">Sujet</th>
                      <th className="px-4 py-3 font-medium">Prospect</th>
                      <th className="px-4 py-3 font-medium">Devis</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium">approvedAt</th>
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
                          <>
                            {row.quote.title}
                            {row.quote.quoteNumber
                              ? ` #${row.quote.quoteNumber}`
                              : ""}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.approvedAt)}
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
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t px-4 py-4">
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
