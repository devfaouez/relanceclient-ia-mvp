"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatAmount, formatDate } from "@/lib/formatters";
import {
  prospectStatusLabel,
  quoteStatusLabel,
  reminderStatusLabel,
} from "@/lib/status-labels";

type Prospect = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
};

type QuoteLine = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  sortOrder: number;
};

type Quote = {
  id: string;
  title: string;
  quoteNumber: string | null;
  amount: string | null;
  currency: string;
  status: string;
  createdAt: string;
  lines: QuoteLine[];
};

type Reminder = {
  id: string;
  quoteId: string;
  subject: string;
  body: string;
  status: string;
  requiresHumanApproval: boolean;
  approvedAt: string | null;
  sentAt: string | null;
};

const QUOTE_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
];

const REMINDER_TONES = [
  { value: "PROFESSIONAL", label: "Professionnel" },
  { value: "FORMAL", label: "Formel" },
  { value: "FRIENDLY", label: "Chaleureux" },
  { value: "DIRECT", label: "Direct" },
] as const;

type ReminderTone = (typeof REMINDER_TONES)[number]["value"];

type GenerateReminderModalState = {
  quoteId: string;
  quoteTitle: string;
} | null;

function toNumber(value: string | null | undefined) {
  if (!value) return 0;
  return Number(value);
}

function quoteTotal(quote: Quote) {
  if (quote.lines.length > 0) {
    return quote.lines.reduce((sum, line) => {
      return sum + toNumber(line.quantity) * toNumber(line.unitPrice);
    }, 0);
  }

  return toNumber(quote.amount);
}

export default function ProspectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loadingProspect, setLoadingProspect] = useState(true);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [pageError, setPageError] = useState<string | null>(null);

  // Quote form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("DRAFT");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Reminder actions
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  // AI generation modal
  const [generateModal, setGenerateModal] =
    useState<GenerateReminderModalState>(null);
  const [generateTone, setGenerateTone] =
    useState<ReminderTone>("PROFESSIONAL");
  const [generateNote, setGenerateNote] = useState("");

  // Reminder edit
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [expandedReminderIds, setExpandedReminderIds] = useState<Set<string>>(
    new Set()
  );
  const [sendConfirmReminder, setSendConfirmReminder] =
    useState<Reminder | null>(null);

  const addPending = (key: string) =>
    setPending((prev) => new Set(prev).add(key));
  const removePending = (key: string) =>
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const fetchReminders = useCallback(() => {
    fetch("/api/reminders")
      .then((res) => {
        if (!res.ok) return [];
        return res.json() as Promise<Reminder[]>;
      })
      .then(setReminders)
      .catch(() => {});
  }, []);

  const fetchQuotes = useCallback(() => {
    setLoadingQuotes(true);
    fetch(`/api/prospects/${params.id}/quotes`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des devis");
        return res.json() as Promise<Quote[]>;
      })
      .then(setQuotes)
      .catch((e: Error) => setPageError(e.message))
      .finally(() => setLoadingQuotes(false));
  }, [params.id]);

  useEffect(() => {
    fetch(`/api/prospects/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Prospect introuvable");
        return res.json() as Promise<Prospect>;
      })
      .then(setProspect)
      .catch((e: Error) => setPageError(e.message))
      .finally(() => setLoadingProspect(false));

    fetchQuotes();
    fetchReminders();
  }, [params.id, fetchQuotes, fetchReminders]);

  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    const body: Record<string, string | number> = {
      title,
      status: quoteStatus,
    };
    if (amount) body.amount = parseFloat(amount);

    const res = await fetch(`/api/prospects/${params.id}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setFormError(
        (json as { error?: string }).error ?? "Erreur lors de la création"
      );
      setFormLoading(false);
      return;
    }

    const createdQuote = (await res.json()) as { id: string };

    setTitle("");
    setAmount("");
    setQuoteStatus("DRAFT");
    setFormLoading(false);
    router.push(`/quotes/${createdQuote.id}`);
  }

  async function handleGenerateReminder(e: React.FormEvent) {
    e.preventDefault();

    if (!generateModal) return;

    setReminderError(null);
    const key = `gen-${generateModal.quoteId}`;
    addPending(key);

    const res = await fetch("/api/reminders/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: generateModal.quoteId,
        tone: generateTone,
        userNote: generateNote.trim() || null,
      }),
    });

    removePending(key);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setReminderError(
        (json as { error?: string }).error ?? "Erreur lors de la génération"
      );
      return;
    }

    setGenerateModal(null);
    setGenerateTone("PROFESSIONAL");
    setGenerateNote("");
    fetchReminders();
  }

  function toggleReminderExpanded(reminderId: string) {
    setExpandedReminderIds((prev) => {
      const next = new Set(prev);
      if (next.has(reminderId)) {
        next.delete(reminderId);
      } else {
        next.add(reminderId);
      }
      return next;
    });
  }

  function startEditingReminder(reminder: Reminder) {
    setEditingReminderId(reminder.id);
    setEditSubject(reminder.subject);
    setEditBody(reminder.body);
    setReminderError(null);
  }

  function cancelEditingReminder() {
    setEditingReminderId(null);
    setEditSubject("");
    setEditBody("");
  }

  async function handleUpdateReminder(reminderId: string) {
    setReminderError(null);

    if (!editSubject.trim() || !editBody.trim()) {
      setReminderError("Le sujet et le contenu de la relance sont obligatoires");
      return;
    }

    const key = `edit-${reminderId}`;
    addPending(key);

    const res = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: editSubject.trim(),
        body: editBody.trim(),
      }),
    });

    removePending(key);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setReminderError(
        (json as { error?: string }).error ?? "Erreur lors de la modification"
      );
      return;
    }

    cancelEditingReminder();
    fetchReminders();
  }

  async function handleApproveReminder(reminderId: string) {
    setReminderError(null);
    const key = `approve-${reminderId}`;
    addPending(key);

    const res = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    removePending(key);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setReminderError(
        (json as { error?: string }).error ?? "Erreur lors de l'approbation"
      );
      return;
    }

    fetchReminders();
  }

  async function handleSendReminder(reminderId: string) {
    setReminderError(null);
    const key = `send-${reminderId}`;
    addPending(key);

    const res = await fetch("/api/reminders/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId }),
    });

    removePending(key);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setReminderError(
        (json as { error?: string }).error ?? "Erreur lors de l'envoi"
      );
      return;
    }

    setSendConfirmReminder(null);
    fetchReminders();
  }

  const quoteIds = new Set(quotes.map((q) => q.id));
  const prospectReminders = reminders.filter((r) => quoteIds.has(r.quoteId));
  const quoteById = Object.fromEntries(quotes.map((q) => [q.id, q]));

  if (pageError) {
    return (
      <section>
        <p className="text-sm text-destructive">{pageError}</p>
        <Link
          href="/prospects"
          className="mt-4 inline-block text-sm underline hover:text-foreground"
        >
          ← Retour aux prospects
        </Link>
      </section>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <section className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link
          href="/prospects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Prospects
        </Link>
        {loadingProspect ? (
          <span className="text-sm text-muted-foreground">Chargement…</span>
        ) : (
          prospect && (
            <h1 className="text-2xl font-semibold">{prospect.name}</h1>
          )
        )}
      </div>

      {/* Fiche prospect */}
      {prospect && (
        <div className="rounded-lg border bg-card p-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{prospect.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="font-medium">{prospect.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Société</dt>
              <dd className="font-medium">{prospect.company ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Statut</dt>
              <dd>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                  {prospectStatusLabel(prospect.status)}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Liste des devis */}
      <div>
        <h2 className="text-lg font-semibold">Devis</h2>

        {loadingQuotes && (
          <p className="mt-2 text-sm text-muted-foreground">
            Chargement des devis…
          </p>
        )}

        {!loadingQuotes && quotes.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun devis pour l&apos;instant.
          </p>
        )}

        {!loadingQuotes && quotes.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Numéro</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{q.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {q.quoteNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {quoteTotal(q) > 0
                        ? formatAmount(quoteTotal(q), q.currency)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        {quoteStatusLabel(q.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(q.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/quotes/${q.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Voir le devis
                        </Link>

                        <a
                          href={`/api/quotes/${q.id}/pdf`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          PDF
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            setGenerateModal({
                              quoteId: q.id,
                              quoteTitle: q.title,
                            })
                          }
                          disabled={pending.has(`gen-${q.id}`)}
                          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          {pending.has(`gen-${q.id}`)
                            ? "Génération…"
                            : "Générer une relance"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Relances */}
      <div>
        <h2 className="text-lg font-semibold">Relances</h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Toute relance doit être approuvée manuellement avant d&apos;être
          envoyée.
        </p>

        {reminderError && (
          <p className="mt-2 text-sm text-destructive">{reminderError}</p>
        )}

        {prospectReminders.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune relance pour l&apos;instant. Générez-en une depuis un devis.
          </p>
        )}

        {prospectReminders.length > 0 && (
          <div className="mt-3 space-y-3">
            {prospectReminders.map((r) => {
              const quote = quoteById[r.quoteId];
              return (
                <div
                  key={r.id}
                  className="rounded-lg border bg-card p-4 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      {editingReminderId === r.id ? (
                        <div className="space-y-3">
                          <div>
                            <label
                              htmlFor={`subject-${r.id}`}
                              className="block text-xs font-medium text-muted-foreground"
                            >
                              Sujet
                            </label>
                            <input
                              id={`subject-${r.id}`}
                              type="text"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`body-${r.id}`}
                              className="block text-xs font-medium text-muted-foreground"
                            >
                              Contenu
                            </label>
                            <textarea
                              id={`body-${r.id}`}
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={8}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{r.subject}</p>
                          {quote && (
                            <p className="text-xs text-muted-foreground">
                              Devis : {quote.title}
                              {quote.quoteNumber ? ` — ${quote.quoteNumber}` : ""}
                            </p>
                          )}
                          <div className="space-y-2">
                            <p
                              className={`whitespace-pre-line text-xs text-muted-foreground ${
                                expandedReminderIds.has(r.id)
                                  ? ""
                                  : "line-clamp-3"
                              }`}
                            >
                              {r.body}
                            </p>

                            {r.body.length > 180 && (
                              <button
                                type="button"
                                onClick={() => toggleReminderExpanded(r.id)}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {expandedReminderIds.has(r.id)
                                  ? "Masquer"
                                  : "Voir le message complet"}
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
                            <span>
                              Approuvé le :{" "}
                              <span className="font-medium">
                                {formatDate(r.approvedAt)}
                              </span>
                            </span>
                            <span>
                              Envoyé le :{" "}
                              <span className="font-medium">
                                {formatDate(r.sentAt)}
                              </span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        {reminderStatusLabel(r.status)}
                      </span>

                      {editingReminderId === r.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateReminder(r.id)}
                            disabled={pending.has(`edit-${r.id}`)}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {pending.has(`edit-${r.id}`) ? "Enregistrement…" : "Enregistrer"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditingReminder}
                            disabled={pending.has(`edit-${r.id}`)}
                            className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          {r.status !== "SENT" &&
                            r.status !== "CANCELLED" &&
                            r.status !== "FAILED" && (
                              <button
                                type="button"
                                onClick={() => startEditingReminder(r)}
                                className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
                              >
                                Modifier
                              </button>
                            )}

                          {r.status !== "APPROVED" &&
                            r.status !== "SENT" &&
                            r.status !== "CANCELLED" &&
                            r.status !== "FAILED" && (
                              <button
                                type="button"
                                onClick={() => handleApproveReminder(r.id)}
                                disabled={pending.has(`approve-${r.id}`)}
                                className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                              >
                                {pending.has(`approve-${r.id}`)
                                  ? "…"
                                  : "Approuver"}
                              </button>
                            )}

                          {r.status === "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => setSendConfirmReminder(r)}
                              disabled={pending.has(`send-${r.id}`)}
                              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {pending.has(`send-${r.id}`) ? "Envoi…" : "Envoyer"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {generateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Générer une relance IA</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Devis : {generateModal.quoteTitle}
              </p>
            </div>

            <form onSubmit={handleGenerateReminder} className="space-y-4">
              <div>
                <label htmlFor="generateTone" className="block text-sm font-medium">
                  Ton de la relance
                </label>
                <select
                  id="generateTone"
                  value={generateTone}
                  onChange={(e) =>
                    setGenerateTone(e.target.value as ReminderTone)
                  }
                  className={inputClass}
                >
                  {REMINDER_TONES.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="generateNote" className="block text-sm font-medium">
                  Note optionnelle pour l’IA
                </label>
                <textarea
                  id="generateNote"
                  value={generateNote}
                  onChange={(e) => setGenerateNote(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Exemple : le client m’a dit qu’il devait valider avec sa direction."
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {generateNote.length}/500 caractères
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGenerateModal(null);
                    setGenerateTone("PROFESSIONAL");
                    setGenerateNote("");
                  }}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={pending.has(`gen-${generateModal.quoteId}`)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {pending.has(`gen-${generateModal.quoteId}`)
                    ? "Génération…"
                    : "Générer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sendConfirmReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Confirmer l’envoi de la relance
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cette action enverra réellement l’e-mail au client. Vérifiez une
                dernière fois le sujet et le contenu avant confirmation.
              </p>
            </div>

            <div className="space-y-3 rounded-md bg-muted/50 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sujet
                </p>
                <p className="mt-1 font-medium">{sendConfirmReminder.subject}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Message
                </p>
                <p className="mt-1 max-h-64 overflow-y-auto whitespace-pre-line text-muted-foreground">
                  {sendConfirmReminder.body}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSendConfirmReminder(null)}
                disabled={pending.has(`send-${sendConfirmReminder.id}`)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => handleSendReminder(sendConfirmReminder.id)}
                disabled={pending.has(`send-${sendConfirmReminder.id}`)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pending.has(`send-${sendConfirmReminder.id}`)
                  ? "Envoi…"
                  : "Confirmer l’envoi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout de devis */}
      <div>
        <h2 className="text-lg font-semibold">Ajouter un devis</h2>
        <form onSubmit={handleCreateQuote} className="mt-3 max-w-lg space-y-4">
          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Titre <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium">
              Montant initial (EUR)
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Le numéro du devis sera généré automatiquement.
            </p>
          </div>

          <div>
            <label htmlFor="quoteStatus" className="block text-sm font-medium">
              Statut
            </label>
            <select
              id="quoteStatus"
              value={quoteStatus}
              onChange={(e) => setQuoteStatus(e.target.value)}
              className={inputClass}
            >
              {QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {quoteStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {formLoading ? "Création…" : "Créer le devis"}
          </button>
        </form>
      </div>
    </section>
  );
}
