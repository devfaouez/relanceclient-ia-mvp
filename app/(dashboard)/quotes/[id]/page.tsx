"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatAmount,
  formatDate,
  formatScheduledDateTime,
} from "@/lib/formatters";
import {
  QUOTE_STATUS_LABELS,
  quoteStatusLabel,
  reminderStatusLabel,
} from "@/lib/status-labels";

type Prospect = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
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
  prospectId: string;
  quoteNumber: string | null;
  title: string;
  amount: string | null;
  currency: string;
  status: string;
  validUntil: string | null;
  legalNotice: string | null;
  paymentTerms: string | null;
  sentAt: string | null;
  createdAt: string;
  prospect: Prospect;
  lines: QuoteLine[];
};

type Preferences = {
  businessName: string | null;
  logoUrl: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  quoteFooter: string | null;
} | null;

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

type QuoteResponse = {
  quote: Quote;
  preferences: Preferences;
};

type DisplayLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isFallback: boolean;
};

const REMINDER_TONES = [
  { value: "PROFESSIONAL", label: "Professionnel" },
  { value: "FORMAL", label: "Formel" },
  { value: "FRIENDLY", label: "Chaleureux" },
  { value: "DIRECT", label: "Direct" },
] as const;

type ReminderTone = (typeof REMINDER_TONES)[number]["value"];

function inputDateValue(date: string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function inputDateTimeValue(date: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toNumber(value: string | null | undefined) {
  if (!value) return 0;
  return Number(value);
}

export default function QuotePreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);

  const [quoteTitle, setQuoteTitle] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("DRAFT");
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [legalNotice, setLegalNotice] = useState("");

  const [lineDescription, setLineDescription] = useState("");
  const [lineQuantity, setLineQuantity] = useState("1");
  const [lineUnitPrice, setLineUnitPrice] = useState("");

  const [generateTone, setGenerateTone] =
    useState<ReminderTone>("PROFESSIONAL");
  const [generateNote, setGenerateNote] = useState("");

  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editReminderSubject, setEditReminderSubject] = useState("");
  const [editReminderBody, setEditReminderBody] = useState("");
  const [schedulingReminderId, setSchedulingReminderId] = useState<
    string | null
  >(null);
  const [scheduleReminderDate, setScheduleReminderDate] = useState("");
  const [sendConfirmReminder, setSendConfirmReminder] =
    useState<Reminder | null>(null);
  const [sendConfirmQuote, setSendConfirmQuote] = useState(false);

  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editLineDescription, setEditLineDescription] = useState("");
  const [editLineQuantity, setEditLineQuantity] = useState("1");
  const [editLineUnitPrice, setEditLineUnitPrice] = useState("");

  const fetchQuote = useCallback(() => {
    setLoading(true);

    fetch(`/api/quotes/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Devis introuvable");
        return res.json() as Promise<QuoteResponse>;
      })
      .then((quoteData) => {
        setData(quoteData);
        setQuoteTitle(quoteData.quote.title);
        setQuoteNumber(quoteData.quote.quoteNumber ?? "");
        setQuoteStatus(quoteData.quote.status);
        setValidUntil(inputDateValue(quoteData.quote.validUntil));
        setPaymentTerms(quoteData.quote.paymentTerms ?? "");
        setLegalNotice(quoteData.quote.legalNotice ?? "");
      })
      .catch((error: Error) => setPageError(error.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const fetchReminders = useCallback(() => {
    fetch("/api/reminders")
      .then((res) => {
        if (!res.ok) return [];
        return res.json() as Promise<Reminder[]>;
      })
      .then((items) => {
        setReminders(items.filter((item) => item.quoteId === params.id));
      })
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    fetchQuote();
    fetchReminders();
  }, [fetchQuote, fetchReminders]);

  const displayLines = useMemo<DisplayLine[]>(() => {
    if (!data) return [];

    if (data.quote.lines.length > 0) {
      return data.quote.lines.map((line) => {
        const quantity = toNumber(line.quantity);
        const unitPrice = toNumber(line.unitPrice);

        return {
          id: line.id,
          description: line.description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
          isFallback: false,
        };
      });
    }

    return [
      {
        id: "fallback-line",
        description: data.quote.title,
        quantity: 1,
        unitPrice: toNumber(data.quote.amount),
        total: toNumber(data.quote.amount),
        isFallback: true,
      },
    ];
  }, [data]);

  const totalAmount = displayLines.reduce((sum, line) => sum + line.total, 0);

  function startEditLine(line: DisplayLine) {
    setActionError(null);
    setActionSuccess(null);
    setEditingLineId(line.id);
    setEditLineDescription(line.description);
    setEditLineQuantity(String(line.quantity));
    setEditLineUnitPrice(String(line.unitPrice));
  }

  function cancelEditLine() {
    setEditingLineId(null);
    setEditLineDescription("");
    setEditLineQuantity("1");
    setEditLineUnitPrice("");
  }

  async function handleUpdateLine(lineId: string) {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/quote-lines/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: editLineDescription.trim(),
        quantity: Number(editLineQuantity),
        unitPrice: Number(editLineUnitPrice),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de la modification de ligne"
      );
      return;
    }

    cancelEditLine();
    setActionSuccess("Ligne modifiée");
    fetchQuote();
  }

  function startEditingReminder(reminder: Reminder) {
    setEditingReminderId(reminder.id);
    setSchedulingReminderId(null);
    setScheduleReminderDate("");
    setEditReminderSubject(reminder.subject);
    setEditReminderBody(reminder.body);
    setActionError(null);
    setActionSuccess(null);
  }

  function cancelEditingReminder() {
    setEditingReminderId(null);
    setEditReminderSubject("");
    setEditReminderBody("");
  }

  function startSchedulingReminder(reminder: Reminder) {
    setSchedulingReminderId(reminder.id);
    setEditingReminderId(null);
    setEditReminderSubject("");
    setEditReminderBody("");
    setScheduleReminderDate(inputDateTimeValue(reminder.scheduledAt));
    setActionError(null);
    setActionSuccess(null);
  }

  function cancelSchedulingReminder() {
    setSchedulingReminderId(null);
    setScheduleReminderDate("");
  }

  async function handleScheduleReminder(reminderId: string) {
    if (!scheduleReminderDate) {
      setActionError("Choisissez une date et une heure de programmation.");
      return;
    }

    const scheduledAt = new Date(scheduleReminderDate);
    if (Number.isNaN(scheduledAt.getTime())) {
      setActionError("La date de programmation est invalide.");
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SCHEDULED",
        scheduledAt: scheduledAt.toISOString(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de la programmation de la relance"
      );
      return;
    }

    cancelSchedulingReminder();
    setActionSuccess("Relance programmée");
    fetchReminders();
  }

  async function handleCancelScheduledReminder(reminderId: string) {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "DRAFT",
        scheduledAt: null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de l'annulation de la programmation"
      );
      return;
    }

    if (schedulingReminderId === reminderId) {
      cancelSchedulingReminder();
    }

    setActionSuccess("Programmation annulée");
    fetchReminders();
  }

  async function handleUpdateReminder(reminderId: string) {
    if (!editReminderSubject.trim() || !editReminderBody.trim()) {
      setActionError("Le sujet et le contenu de la relance sont obligatoires");
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: editReminderSubject.trim(),
        body: editReminderBody.trim(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de la modification de la relance"
      );
      return;
    }

    cancelEditingReminder();
    setActionSuccess("Relance modifiée");
    fetchReminders();
  }

  async function handleApproveReminder(reminderId: string) {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de l'approbation de la relance"
      );
      return;
    }

    setActionSuccess("Relance approuvée");
    fetchReminders();
  }

  async function handleSendReminder(reminderId: string) {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch("/api/reminders/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de l'envoi de la relance"
      );
      return;
    }

    setSendConfirmReminder(null);
    setActionSuccess("Relance envoyée");
    fetchReminders();
  }

  async function handleGenerateReminder(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch("/api/reminders/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: params.id,
        tone: generateTone,
        userNote: generateNote.trim() || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de la génération de la relance"
      );
      return;
    }

    setGenerateTone("PROFESSIONAL");
    setGenerateNote("");
    setActionSuccess("Relance IA générée");
    fetchReminders();
  }

  async function handleMarkAsSent() {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/quotes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SENT",
        sentAt: new Date().toISOString(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors du changement de statut"
      );
      return;
    }

    setQuoteStatus("SENT");
    setActionSuccess("Devis marqué comme envoyé");
    fetchQuote();
  }

  async function handleSendQuote() {
    setQuoteSending(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/quotes/${params.id}/send`, {
      method: "POST",
    });

    setQuoteSending(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de l'envoi du devis"
      );
      return;
    }

    setSendConfirmQuote(false);
    setActionSuccess("Devis envoyé par email");
    fetchQuote();
  }

  async function handleUpdateTerms(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/quotes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quoteTitle.trim(),
        quoteNumber: quoteNumber.trim() || null,
        status: quoteStatus,
        validUntil: validUntil ? `${validUntil}T00:00:00.000Z` : null,
        paymentTerms: paymentTerms.trim() || null,
        legalNotice: legalNotice.trim() || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ?? "Erreur lors de l'enregistrement"
      );
      return;
    }

    setActionSuccess("Informations du devis enregistrées");
    fetchQuote();
  }

  async function handleAddLine(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/quotes/${params.id}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: lineDescription.trim(),
        quantity: Number(lineQuantity),
        unitPrice: Number(lineUnitPrice),
        sortOrder: data?.quote.lines.length ?? 0,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ?? "Erreur lors de l'ajout de ligne"
      );
      return;
    }

    setLineDescription("");
    setLineQuantity("1");
    setLineUnitPrice("");
    setActionSuccess("Ligne ajoutée");
    fetchQuote();
  }

  async function handleDeleteLine(lineId: string) {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await fetch(`/api/quote-lines/${lineId}`, {
      method: "DELETE",
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de la suppression de ligne"
      );
      return;
    }

    if (editingLineId === lineId) {
      cancelEditLine();
    }

    setActionSuccess("Ligne supprimée");
    fetchQuote();
  }

  if (loading) {
    return (
      <section>
        <p className="text-sm text-muted-foreground">Chargement du devis…</p>
      </section>
    );
  }

  if (pageError || !data) {
    return (
      <section>
        <p className="text-sm text-destructive">
          {pageError ?? "Devis introuvable"}
        </p>
        <Link
          href="/prospects"
          className="mt-4 inline-block text-sm underline hover:text-foreground"
        >
          ← Retour aux prospects
        </Link>
      </section>
    );
  }

  const { quote, preferences } = data;
  const prospect = quote.prospect;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link
            href={`/prospects/${quote.prospectId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Retour au prospect
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Prévisualisation du devis</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setActionSuccess(null);

              if (!prospect.email) {
                setActionError(
                  "Impossible d'envoyer le devis : le prospect n'a pas d'adresse email."
                );
                return;
              }

              setSendConfirmQuote(true);
            }}
            disabled={saving || quoteSending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {quoteSending ? "Envoi…" : "Envoyer le devis"}
          </button>

          {quote.status !== "SENT" && (
            <button
              type="button"
              onClick={handleMarkAsSent}
              disabled={saving || quoteSending}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Marquer comme envoyé
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            disabled={quoteSending}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Imprimer
          </button>

          <a
            href={`/api/quotes/${quote.id}/pdf`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Télécharger PDF
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="quote-print-area mx-auto w-full max-w-5xl rounded-xl border bg-white p-8 text-slate-950 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex items-start justify-between gap-8 border-b pb-8">
            <div>
              {preferences?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preferences.logoUrl}
                  alt="Logo entreprise"
                  className="mb-4 max-h-20 max-w-48 object-contain"
                />
              ) : null}

              <h2 className="text-xl font-bold">
                {preferences?.businessName ?? "Entreprise"}
              </h2>

              <div className="mt-3 space-y-1 whitespace-pre-line text-sm text-slate-600">
                {preferences?.companyAddress && <p>{preferences.companyAddress}</p>}
                {preferences?.companyPhone && <p>Tél. : {preferences.companyPhone}</p>}
                {preferences?.companyEmail && <p>Email : {preferences.companyEmail}</p>}
                {preferences?.companyWebsite && <p>Site : {preferences.companyWebsite}</p>}
              </div>
            </div>

            <div className="text-right">
              <p className="text-4xl font-bold uppercase tracking-wide">Devis</p>
              <p className="mt-2 text-sm text-slate-600">
                N° {quote.quoteNumber ?? quote.id.slice(0, 8)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Date : {formatDate(quote.createdAt)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Valable jusqu’au : {formatDate(quote.validUntil)}
              </p>
              {quote.sentAt && (
                <p className="mt-1 text-sm text-slate-600">
                  Envoyé le : {formatDate(quote.sentAt)}
                </p>
              )}
              <p className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                {quoteStatusLabel(quote.status)}
              </p>
            </div>
          </div>

          <div className="grid gap-8 border-b py-8 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Client
              </h3>
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-semibold">{prospect.name}</p>
                {prospect.company && <p>{prospect.company}</p>}
                {prospect.email && <p>{prospect.email}</p>}
                {prospect.phone && <p>{prospect.phone}</p>}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Objet du devis
              </h3>
              <p className="mt-3 text-sm font-medium">{quote.title}</p>
            </div>
          </div>

          <div className="py-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold">Désignation</th>
                  <th className="px-4 py-3 text-right font-semibold">Qté</th>
                  <th className="px-4 py-3 text-right font-semibold">Prix unitaire</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {displayLines.map((line) => {
                  const isEditing = editingLineId === line.id && !line.isFallback;
                  const editedQuantity = Number(editLineQuantity);
                  const editedUnitPrice = Number(editLineUnitPrice);
                  const editedTotal =
                    Number.isFinite(editedQuantity) && Number.isFinite(editedUnitPrice)
                      ? editedQuantity * editedUnitPrice
                      : 0;

                  return (
                    <tr key={line.id} className="border-b align-top">
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <textarea
                            required
                            value={editLineDescription}
                            onChange={(e) => setEditLineDescription(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          line.description
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {isEditing ? (
                          <input
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editLineQuantity}
                            onChange={(e) => setEditLineQuantity(e.target.value)}
                            className="w-24 rounded-md border px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          line.quantity
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {isEditing ? (
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={editLineUnitPrice}
                            onChange={(e) => setEditLineUnitPrice(e.target.value)}
                            className="w-28 rounded-md border px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          formatAmount(line.unitPrice, quote.currency)
                        )}
                      </td>

                      <td className="px-4 py-4 text-right font-medium">
                        {formatAmount(
                          isEditing ? editedTotal : line.total,
                          quote.currency
                        )}
                      </td>

                      <td className="px-4 py-4 text-right print:hidden">
                        {!line.isFallback && (
                          <div className="flex justify-end gap-3">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLine(line.id)}
                                  disabled={saving}
                                  className="text-xs font-medium hover:underline disabled:opacity-50"
                                >
                                  Enregistrer
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditLine}
                                  disabled={saving}
                                  className="text-xs font-medium text-muted-foreground hover:underline disabled:opacity-50"
                                >
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditLine(line)}
                                  disabled={saving}
                                  className="text-xs font-medium hover:underline disabled:opacity-50"
                                >
                                  Modifier
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteLine(line.id)}
                                  disabled={saving}
                                  className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                                >
                                  Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-sm rounded-lg bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span>Total</span>
                  <span className="font-bold">
                    {formatAmount(totalAmount, quote.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(quote.paymentTerms || quote.legalNotice) && (
            <div className="grid gap-6 border-t py-6 text-sm md:grid-cols-2">
              {quote.paymentTerms && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Conditions de paiement
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-slate-600">
                    {quote.paymentTerms}
                  </p>
                </div>
              )}

              {quote.legalNotice && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mentions légales
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-slate-600">
                    {quote.legalNotice}
                  </p>
                </div>
              )}
            </div>
          )}

          {preferences?.quoteFooter && (
            <div className="border-t pt-6 text-xs leading-relaxed text-slate-500 whitespace-pre-line">
              {preferences.quoteFooter}
            </div>
          )}
        </div>

        <aside className="quote-print-hidden space-y-4 print:hidden">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Relances liées au devis</h2>

            <form onSubmit={handleGenerateReminder} className="mt-3 space-y-3 border-b pb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Ton de la relance
                </label>
                <select
                  value={generateTone}
                  onChange={(e) =>
                    setGenerateTone(e.target.value as ReminderTone)
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {REMINDER_TONES.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Note optionnelle pour l’IA
                </label>
                <textarea
                  value={generateNote}
                  onChange={(e) => setGenerateNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Exemple : le client hésite encore sur le prix."
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {generateNote.length}/500 caractères
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Génération…" : "Générer une relance IA"}
              </button>
            </form>

            {reminders.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Aucune relance générée pour ce devis.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {reminders.map((reminder) => {
                  const isEditing = editingReminderId === reminder.id;
                  const isScheduling = schedulingReminderId === reminder.id;
                  const canEdit =
                    reminder.status !== "SENT" &&
                    reminder.status !== "CANCELLED" &&
                    reminder.status !== "FAILED";
                  const canApprove = reminder.status === "PENDING_APPROVAL";
                  const canSchedule =
                    reminder.status !== "SENT" &&
                    reminder.status !== "CANCELLED" &&
                    reminder.status !== "FAILED";
                  const canSend = reminder.status === "APPROVED";
                  const isScheduled = reminder.status === "SCHEDULED";

                  return (
                    <div
                      key={reminder.id}
                      className="rounded-md border bg-background p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground">
                                  Sujet
                                </label>
                                <input
                                  type="text"
                                  value={editReminderSubject}
                                  onChange={(e) =>
                                    setEditReminderSubject(e.target.value)
                                  }
                                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-muted-foreground">
                                  Message
                                </label>
                                <textarea
                                  value={editReminderBody}
                                  onChange={(e) =>
                                    setEditReminderBody(e.target.value)
                                  }
                                  rows={8}
                                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium">{reminder.subject}</p>
                              <p className="mt-2 line-clamp-4 whitespace-pre-line text-xs text-muted-foreground">
                                {reminder.body}
                              </p>
                            </>
                          )}
                        </div>

                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          {reminderStatusLabel(reminder.status)}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <p>Créée le : {formatDate(reminder.createdAt)}</p>
                        <p>Approuvée le : {formatDate(reminder.approvedAt)}</p>
                        <p>{formatScheduledDateTime(reminder.scheduledAt)}</p>
                        <p>Envoyée le : {formatDate(reminder.sentAt)}</p>
                      </div>

                      {isScheduling && (
                        <div className="mt-3 rounded-md border bg-muted/30 p-3">
                          <label className="block text-xs font-medium text-muted-foreground">
                            Date et heure de programmation
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduleReminderDate}
                            onChange={(e) =>
                              setScheduleReminderDate(e.target.value)
                            }
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateReminder(reminder.id)}
                              disabled={saving}
                              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              Enregistrer
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditingReminder}
                              disabled={saving}
                              className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          </>
                        ) : isScheduling ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleScheduleReminder(reminder.id)}
                              disabled={saving}
                              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              Enregistrer
                            </button>

                            <button
                              type="button"
                              onClick={cancelSchedulingReminder}
                              disabled={saving}
                              className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => startEditingReminder(reminder)}
                                disabled={saving}
                                className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                              >
                                Modifier
                              </button>
                            )}

                            {canSchedule && (
                              <button
                                type="button"
                                onClick={() => startSchedulingReminder(reminder)}
                                disabled={saving}
                                className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                              >
                                {isScheduled
                                  ? "Modifier la programmation"
                                  : "Programmer"}
                              </button>
                            )}

                            {isScheduled && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCancelScheduledReminder(reminder.id)
                                }
                                disabled={saving}
                                className="rounded-md border px-3 py-1 text-xs font-medium text-destructive hover:bg-muted disabled:opacity-50"
                              >
                                Annuler la programmation
                              </button>
                            )}

                            {canApprove && (
                              <button
                                type="button"
                                onClick={() => handleApproveReminder(reminder.id)}
                                disabled={saving}
                                className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                              >
                                Approuver
                              </button>
                            )}

                            {canSend && (
                              <button
                                type="button"
                                onClick={() => setSendConfirmReminder(reminder)}
                                disabled={saving}
                                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              >
                                Envoyer
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {actionError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </p>
          )}

          {actionSuccess && (
            <p className="rounded-md border bg-muted p-3 text-sm">
              {actionSuccess}
            </p>
          )}

          <form
            onSubmit={handleAddLine}
            className="rounded-lg border bg-card p-4"
          >
            <h2 className="text-sm font-semibold">Ajouter une ligne</h2>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Désignation
                </label>
                <textarea
                  required
                  value={lineDescription}
                  onChange={(e) => setLineDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">
                    Quantité
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={lineQuantity}
                    onChange={(e) => setLineQuantity(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground">
                    Prix unitaire
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineUnitPrice}
                    onChange={(e) => setLineUnitPrice(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Ajouter la ligne"}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleUpdateTerms}
            className="rounded-lg border bg-card p-4"
          >
            <h2 className="text-sm font-semibold">Informations du devis</h2>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Titre du devis
                </label>
                <input
                  required
                  type="text"
                  value={quoteTitle}
                  onChange={(e) => setQuoteTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Numéro du devis
                </label>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder={quote.id.slice(0, 8)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Statut
                </label>
                <select
                  value={quoteStatus}
                  onChange={(e) => setQuoteStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(QUOTE_STATUS_LABELS).map(
                    ([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Date de validité
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Conditions de paiement
                </label>
                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Exemple : Paiement à 30 jours après réception de facture."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Mentions légales
                </label>
                <textarea
                  value={legalNotice}
                  onChange={(e) => setLegalNotice(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Exemple : TVA non applicable, article 293 B du CGI."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer les informations"}
              </button>
            </div>
          </form>
        </aside>
      </div>

      {sendConfirmQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 print:hidden">
          <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Confirmer l’envoi du devis</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Le devis PDF sera envoyé par email au prospect.
            </p>

            <div className="mt-4 space-y-3 rounded-md bg-muted/50 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Destinataire
                </p>
                <p className="mt-1 font-medium">{prospect.name}</p>
                <p className="text-muted-foreground">{prospect.email}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sujet
                </p>
                <p className="mt-1 font-medium">
                  Devis {quote.quoteNumber ?? quote.title}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSendConfirmQuote(false)}
                disabled={quoteSending}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSendQuote}
                disabled={quoteSending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {quoteSending ? "Envoi…" : "Confirmer l’envoi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sendConfirmReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 print:hidden">
          <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Confirmer l’envoi</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette relance sera envoyée par email au client du devis.
            </p>

            <div className="mt-4 space-y-3 rounded-md bg-muted/50 p-4 text-sm">
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
                disabled={saving}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => handleSendReminder(sendConfirmReminder.id)}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Envoi…" : "Confirmer l’envoi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
