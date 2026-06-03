"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  Mail,
  Pencil,
  Printer,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
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
  acceptedAt: string | null;
  rejectedAt: string | null;
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

type Template = {
  id: string;
  name: string;
  subject: string;
  status: string;
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

const CLOSED_QUOTE_STATUSES = ["ACCEPTED", "REJECTED", "CANCELLED"];

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

async function getApiErrorMessage(
  res: Response,
  fallbackMessage: string,
): Promise<string> {
  const json = await res.json().catch(() => ({}));
  return (json as { error?: string }).error ?? fallbackMessage;
}

function quoteStatusTone(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "SENT":
      return "bg-amber-50 text-amber-700";
    case "DRAFT":
    case "CANCELLED":
      return "bg-slate-100 text-slate-600";
    case "EXPIRED":
    case "REJECTED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function reminderStatusTone(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "SENT":
      return "bg-primary text-primary-foreground";
    case "SCHEDULED":
      return "bg-sky-50 text-sky-700";
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-semibold leading-none text-primary-foreground shadow-[var(--surface-shadow)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border border-input bg-card px-4 py-2.5 text-sm font-semibold leading-none transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

const smallSecondaryButtonClass =
  "inline-flex items-center justify-center rounded-[9px] border border-input bg-card px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

const inputClass =
  "mt-1.5 w-full rounded-[11px] border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-[hsl(var(--emerald-soft))] disabled:opacity-50";

export default function QuotePreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSendFailed, setQuoteSendFailed] = useState(false);

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
  const [generateTemplateId, setGenerateTemplateId] = useState("");

  const [editingReminderId, setEditingReminderId] = useState<string | null>(
    null,
  );
  const [editReminderSubject, setEditReminderSubject] = useState("");
  const [editReminderBody, setEditReminderBody] = useState("");
  const [schedulingReminderId, setSchedulingReminderId] = useState<
    string | null
  >(null);
  const [scheduleReminderDate, setScheduleReminderDate] = useState("");
  const [sendConfirmReminder, setSendConfirmReminder] =
    useState<Reminder | null>(null);
  const [sendConfirmQuote, setSendConfirmQuote] = useState(false);
  const [statusConfirmQuote, setStatusConfirmQuote] = useState<
    "REJECTED" | "CANCELLED" | null
  >(null);

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

  const fetchTemplates = useCallback(() => {
    setTemplatesLoading(true);

    fetch("/api/templates")
      .then((res) => {
        if (!res.ok) return [];
        return res.json() as Promise<Template[]>;
      })
      .then((items) => {
        setTemplates(items.filter((item) => item.status === "ACTIVE"));
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

  useEffect(() => {
    fetchQuote();
    fetchReminders();
    fetchTemplates();
  }, [fetchQuote, fetchReminders, fetchTemplates]);

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
          "Erreur lors de la modification de ligne",
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
          "Erreur lors de la programmation de la relance",
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
        status: "APPROVED",
        scheduledAt: null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de l'annulation de la programmation",
      );
      return;
    }

    if (schedulingReminderId === reminderId) {
      cancelSchedulingReminder();
    }

    setActionSuccess("Programmation annulée. La relance reste approuvée.");
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
          "Erreur lors de la modification de la relance",
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
          "Erreur lors de l'approbation de la relance",
      );
      return;
    }

    setActionSuccess("Relance approuvée");
    fetchReminders();
  }

  async function handleSendReminder(reminderId: string) {
    const reminder = reminders.find((item) => item.id === reminderId);
    const isRetry = reminder?.status === "FAILED";

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId }),
      });

      if (!res.ok) {
        setActionError(
          await getApiErrorMessage(res, "Erreur lors de l'envoi de la relance"),
        );
        return;
      }

      setSendConfirmReminder(null);
      setActionSuccess(isRetry ? "Relance renvoyée" : "Relance envoyée");
      fetchReminders();
    } catch {
      setActionError(
        "Erreur réseau : impossible de contacter le serveur pour envoyer la relance.",
      );
    } finally {
      setSaving(false);
    }
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
        templateId: generateTemplateId || null,
        userNote: generateNote.trim() || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setActionError(
        (json as { error?: string }).error ??
          "Erreur lors de la génération de la relance",
      );
      return;
    }

    setGenerateTone("PROFESSIONAL");
    setGenerateTemplateId("");
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
          "Erreur lors du changement de statut",
      );
      return;
    }

    setQuoteStatus("SENT");
    setActionSuccess("Devis marqué comme envoyé");
    fetchQuote();
  }

  async function handleUpdateQuoteStatus(
    status: "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED",
  ) {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const payload: {
      status: "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
      acceptedAt?: string | null;
      rejectedAt?: string | null;
    } = { status };

    if (status === "ACCEPTED") {
      payload.acceptedAt = new Date().toISOString();
      payload.rejectedAt = null;
    }

    if (status === "REJECTED") {
      payload.rejectedAt = new Date().toISOString();
      payload.acceptedAt = null;
    }

    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setStatusConfirmQuote(null);
        setActionError(
          (json as { error?: string }).error ??
            "Erreur lors du changement de statut du devis",
        );
        return;
      }

      setQuoteStatus(status);
      setActionSuccess(
        `Devis marqué comme ${quoteStatusLabel(status).toLowerCase()}`,
      );
      setStatusConfirmQuote(null);
      fetchQuote();
    } catch {
      setStatusConfirmQuote(null);
      setActionError("Impossible de mettre à jour le statut du devis.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendQuote() {
    setQuoteSending(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/quotes/${params.id}/send`, {
        method: "POST",
      });

      if (!res.ok) {
        setQuoteSendFailed(true);
        setActionError(
          await getApiErrorMessage(
            res,
            "Erreur lors de l'envoi du devis. Le devis n'a pas été marqué comme envoyé.",
          ),
        );
        return;
      }

      setSendConfirmQuote(false);
      setQuoteSendFailed(false);
      setActionSuccess("Devis envoyé par email. Le statut est passé à Envoyé.");
      fetchQuote();
    } catch {
      setQuoteSendFailed(true);
      setActionError(
        "Erreur réseau : impossible de contacter le serveur pour envoyer le devis. Le devis n'a pas été marqué comme envoyé.",
      );
    } finally {
      setQuoteSending(false);
    }
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
        (json as { error?: string }).error ?? "Erreur lors de l'enregistrement",
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
        (json as { error?: string }).error ?? "Erreur lors de l'ajout de ligne",
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
          "Erreur lors de la suppression de ligne",
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
      <section className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl border bg-card shadow-[var(--surface-shadow)]" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="h-[520px] animate-pulse rounded-2xl border bg-card shadow-[var(--surface-shadow)]" />
          <div className="h-80 animate-pulse rounded-2xl border bg-card shadow-[var(--surface-shadow)]" />
        </div>
        <p className="sr-only">Chargement du devis…</p>
      </section>
    );
  }

  if (pageError || !data) {
    return (
      <section className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 shadow-[var(--surface-shadow)]">
        <p className="text-sm font-medium text-destructive">
          {pageError ?? "Devis introuvable"}
        </p>
        <Link
          href="/prospects"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-destructive hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux prospects
        </Link>
      </section>
    );
  }

  const { quote, preferences } = data;
  const prospect = quote.prospect;
  const isClosedQuote = CLOSED_QUOTE_STATUSES.includes(quote.status);
  const sendQuoteButtonLabel = quoteSending
    ? "Envoi…"
    : quoteSendFailed
      ? "Réessayer l’envoi du devis"
      : quote.status === "SENT"
        ? "Renvoyer le devis"
        : "Envoyer le devis";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] print:hidden">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <Link
              href={`/prospects/${quote.prospectId}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au prospect
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">Prévisualisation du devis</h1>
              <StatusBadge
                label={quoteStatusLabel(quote.status)}
                tone={quoteStatusTone(quote.status)}
              />
            </div>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {quote.quoteNumber ?? quote.id.slice(0, 8)} · {quote.title} ·{" "}
              {prospect.company ?? prospect.name}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={quoteSending}
              className={secondaryButtonClass}
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>

            <a
              href={`/api/quotes/${quote.id}/pdf`}
              className={primaryButtonClass}
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-[var(--surface-shadow)] print:hidden sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setActionSuccess(null);

            if (!prospect.email?.trim()) {
              setActionError(
                "Impossible d'envoyer le devis : le prospect n'a pas d'adresse email.",
              );
              setQuoteSendFailed(true);
              return;
            }

            setSendConfirmQuote(true);
          }}
          disabled={saving || quoteSending}
          className={primaryButtonClass}
        >
          <Mail className="h-4 w-4" />
          {sendQuoteButtonLabel}
        </button>

        {!isClosedQuote && quote.status !== "SENT" && (
          <button
            type="button"
            onClick={handleMarkAsSent}
            disabled={saving || quoteSending}
            className={secondaryButtonClass}
          >
            <Send className="h-4 w-4" />
            Marquer comme envoyé
          </button>
        )}

        {!isClosedQuote && (
          <>
            {quote.status !== "ACCEPTED" && (
              <button
                type="button"
                onClick={() => handleUpdateQuoteStatus("ACCEPTED")}
                disabled={saving || quoteSending}
                className={secondaryButtonClass}
              >
                <Check className="h-4 w-4" />
                Marquer comme accepté
              </button>
            )}

            {quote.status !== "REJECTED" && (
              <button
                type="button"
                onClick={() => setStatusConfirmQuote("REJECTED")}
                disabled={saving || quoteSending}
                className={secondaryButtonClass}
              >
                <XCircle className="h-4 w-4" />
                Marquer comme refusé
              </button>
            )}

            {quote.status !== "EXPIRED" && (
              <button
                type="button"
                onClick={() => handleUpdateQuoteStatus("EXPIRED")}
                disabled={saving || quoteSending}
                className={secondaryButtonClass}
              >
                Marquer comme expiré
              </button>
            )}

            {quote.status !== "CANCELLED" && (
              <button
                type="button"
                onClick={() => setStatusConfirmQuote("CANCELLED")}
                disabled={saving || quoteSending}
                className="inline-flex items-center justify-center rounded-[11px] border border-input bg-card px-4 py-2.5 text-sm font-semibold leading-none text-destructive transition hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler le devis
              </button>
            )}
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="quote-print-area mx-auto w-full max-w-5xl rounded-2xl border border-border bg-white p-5 text-slate-950 shadow-[var(--surface-shadow)] sm:p-8 lg:p-10 print:max-w-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-col gap-8 border-b border-slate-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {preferences?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preferences.logoUrl}
                  alt="Logo entreprise"
                  className="mb-4 max-h-20 max-w-48 object-contain"
                />
              ) : null}

              <div className="flex items-center gap-3">
                {!preferences?.logoUrl && (
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <FileText className="h-5 w-5" />
                  </span>
                )}
                <h2 className="text-xl font-bold">
                  {preferences?.businessName ?? "Entreprise"}
                </h2>
              </div>

              <div className="mt-4 space-y-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                {preferences?.companyAddress && (
                  <p>{preferences.companyAddress}</p>
                )}
                {preferences?.companyPhone && (
                  <p>Tél. : {preferences.companyPhone}</p>
                )}
                {preferences?.companyEmail && (
                  <p>Email : {preferences.companyEmail}</p>
                )}
                {preferences?.companyWebsite && (
                  <p>Site : {preferences.companyWebsite}</p>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-3xl font-extrabold uppercase tracking-wide">
                Devis
              </p>
              <p className="mt-3 text-sm text-slate-600">
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
              {quote.acceptedAt && (
                <p className="mt-1 text-sm text-slate-600">
                  Accepté le : {formatDate(quote.acceptedAt)}
                </p>
              )}
              {quote.rejectedAt && (
                <p className="mt-1 text-sm text-slate-600">
                  Refusé le : {formatDate(quote.rejectedAt)}
                </p>
              )}
              <span className="mt-4 inline-flex">
                <StatusBadge
                  label={quoteStatusLabel(quote.status)}
                  tone={quoteStatusTone(quote.status)}
                />
              </span>
            </div>
          </div>

          <div className="grid gap-8 border-b border-slate-200 py-8 md:grid-cols-2">
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
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[hsl(var(--emerald-tint))] text-left text-primary">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
                      Désignation
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">
                      Qté
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">
                      Total
                    </th>
                    <th className="px-4 py-3 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayLines.map((line) => {
                    const isEditing =
                      editingLineId === line.id && !line.isFallback;
                    const editedQuantity = Number(editLineQuantity);
                    const editedUnitPrice = Number(editLineUnitPrice);
                    const editedTotal =
                      Number.isFinite(editedQuantity) &&
                      Number.isFinite(editedUnitPrice)
                        ? editedQuantity * editedUnitPrice
                        : 0;

                    return (
                      <tr
                        key={line.id}
                        className="border-b border-slate-200 align-top last:border-0"
                      >
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {isEditing ? (
                            <textarea
                              required
                              value={editLineDescription}
                              onChange={(e) =>
                                setEditLineDescription(e.target.value)
                              }
                              rows={2}
                              className="w-full rounded-[10px] border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-primary focus:ring-4 focus:ring-[hsl(var(--emerald-soft))]"
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
                              onChange={(e) =>
                                setEditLineQuantity(e.target.value)
                              }
                              className="w-24 rounded-[10px] border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-primary focus:ring-4 focus:ring-[hsl(var(--emerald-soft))]"
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
                              onChange={(e) =>
                                setEditLineUnitPrice(e.target.value)
                              }
                              className="w-28 rounded-[10px] border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-primary focus:ring-4 focus:ring-[hsl(var(--emerald-soft))]"
                            />
                          ) : (
                            formatAmount(line.unitPrice, quote.currency)
                          )}
                        </td>

                        <td className="px-4 py-4 text-right font-medium">
                          {formatAmount(
                            isEditing ? editedTotal : line.total,
                            quote.currency,
                          )}
                        </td>

                        <td className="px-4 py-4 text-right print:hidden">
                          {!line.isFallback && (
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateLine(line.id)}
                                    disabled={saving}
                                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                                  >
                                    Enregistrer
                                  </button>

                                  <button
                                    type="button"
                                    onClick={cancelEditLine}
                                    disabled={saving}
                                    className="text-xs font-semibold text-muted-foreground hover:underline disabled:opacity-50"
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
                                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                                  >
                                    Modifier
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLine(line.id)}
                                    disabled={saving}
                                    className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
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
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-sm rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] p-5">
                <div className="flex justify-between gap-6 text-sm">
                  <span className="font-medium text-slate-600">Total</span>
                  <span className="text-lg font-bold text-primary">
                    {formatAmount(totalAmount, quote.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(quote.paymentTerms || quote.legalNotice) && (
            <div className="grid gap-6 border-t border-slate-200 py-6 text-sm md:grid-cols-2">
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
            <div className="whitespace-pre-line border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
              {preferences.quoteFooter}
            </div>
          )}
        </div>

        <aside className="quote-print-hidden min-w-0 space-y-4 print:hidden xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
            <h2 className="text-[17px] font-bold">Relances liées au devis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Générez, relisez puis validez. Rien ne part sans approbation.
            </p>

            <form
              onSubmit={handleGenerateReminder}
              className="mt-4 space-y-3 rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] p-4"
            >
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Modèle de relance
                </label>
                <select
                  value={generateTemplateId}
                  onChange={(e) => setGenerateTemplateId(e.target.value)}
                  disabled={templatesLoading}
                  className={inputClass}
                >
                  <option value="">
                    {templatesLoading
                      ? "Chargement des modèles..."
                      : "Sans modèle"}
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Ton de la relance
                </label>
                <select
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
                <label className="block text-xs font-semibold text-foreground">
                  Note optionnelle pour l’IA
                </label>
                <textarea
                  value={generateNote}
                  onChange={(e) => setGenerateNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Exemple : le client hésite encore sur le prix."
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {generateNote.length}/500 caractères
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`${primaryButtonClass} w-full`}
              >
                <Sparkles className="h-4 w-4" />
                {saving ? "Génération…" : "Générer une relance IA"}
              </button>
            </form>

            {reminders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
                Aucune relance générée pour ce devis.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {reminders.map((reminder) => {
                  const isEditing = editingReminderId === reminder.id;
                  const isScheduling = schedulingReminderId === reminder.id;
                  const canEdit =
                    reminder.status !== "SENT" &&
                    reminder.status !== "CANCELLED" &&
                    reminder.status !== "FAILED";
                  const canApprove = reminder.status === "PENDING_APPROVAL";
                  const canSchedule =
                    reminder.status === "APPROVED" ||
                    reminder.status === "SCHEDULED";
                  const canSend = reminder.status === "APPROVED";
                  const canRetry = reminder.status === "FAILED";
                  const isScheduled = reminder.status === "SCHEDULED";

                  return (
                    <div
                      key={reminder.id}
                      className="rounded-xl border border-border bg-background p-4 text-sm"
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
                                  className={inputClass}
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
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="font-semibold text-foreground">
                                {reminder.subject}
                              </p>
                              <p className="mt-2 line-clamp-4 whitespace-pre-line text-xs text-muted-foreground">
                                {reminder.body}
                              </p>
                            </>
                          )}
                        </div>

                        <StatusBadge
                          label={reminderStatusLabel(reminder.status)}
                          tone={reminderStatusTone(reminder.status)}
                        />
                      </div>

                      {canRetry && (
                        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                          Échec d’envoi. Vérifiez le contenu avant de réessayer.
                        </p>
                      )}

                      <div className="mt-3 space-y-1 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                        <p>Créée le : {formatDate(reminder.createdAt)}</p>
                        <p>Approuvée le : {formatDate(reminder.approvedAt)}</p>
                        <p>
                          Programmation :{" "}
                          {reminder.scheduledAt
                            ? formatScheduledDateTime(reminder.scheduledAt)
                            : "Non programmée"}
                        </p>
                        <p>Envoyée le : {formatDate(reminder.sentAt)}</p>
                      </div>

                      {isScheduling && (
                        <div className="mt-3 rounded-xl border border-border bg-card p-3">
                          <label className="block text-xs font-medium text-muted-foreground">
                            {isScheduled
                              ? "Modifier la programmation"
                              : "Programmer la relance"}
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduleReminderDate}
                            onChange={(e) =>
                              setScheduleReminderDate(e.target.value)
                            }
                            className={inputClass}
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
                              className="inline-flex flex-1 items-center justify-center rounded-[9px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
                            >
                              Enregistrer
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditingReminder}
                              disabled={saving}
                              className={`${smallSecondaryButtonClass} flex-1 sm:flex-none`}
                            >
                              Annuler
                            </button>
                          </>
                        ) : isScheduling ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleScheduleReminder(reminder.id)
                              }
                              disabled={saving}
                              className="inline-flex flex-1 items-center justify-center rounded-[9px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
                            >
                              Enregistrer
                            </button>

                            <button
                              type="button"
                              onClick={cancelSchedulingReminder}
                              disabled={saving}
                              className={`${smallSecondaryButtonClass} flex-1 sm:flex-none`}
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
                                className={`${smallSecondaryButtonClass} flex-1 sm:flex-none`}
                              >
                                Modifier
                              </button>
                            )}

                            {canSchedule && (
                              <button
                                type="button"
                                onClick={() =>
                                  startSchedulingReminder(reminder)
                                }
                                disabled={saving}
                                className={`${smallSecondaryButtonClass} flex-1 sm:flex-none`}
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
                                className="inline-flex flex-1 items-center justify-center rounded-[9px] border border-input bg-card px-3 py-1.5 text-xs font-semibold text-destructive transition hover:border-destructive hover:bg-destructive/10 disabled:opacity-50 sm:flex-none"
                              >
                                Annuler la programmation
                              </button>
                            )}

                            {canApprove && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApproveReminder(reminder.id)
                                }
                                disabled={saving}
                                className={`${smallSecondaryButtonClass} flex-1 sm:flex-none`}
                              >
                                Approuver
                              </button>
                            )}

                            {canSend && (
                              <button
                                type="button"
                                onClick={() => setSendConfirmReminder(reminder)}
                                disabled={saving}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Envoyer
                              </button>
                            )}

                            {canRetry && (
                              <button
                                type="button"
                                onClick={() => handleSendReminder(reminder.id)}
                                disabled={saving}
                                className="inline-flex flex-1 items-center justify-center rounded-[9px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
                              >
                                {saving ? "Réessai…" : "Réessayer l’envoi"}
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
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {actionError}
            </p>
          )}

          {actionSuccess && (
            <p className="rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] p-4 text-sm font-medium text-primary">
              {actionSuccess}
            </p>
          )}

          <form
            onSubmit={handleAddLine}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]"
          >
            <h2 className="text-[17px] font-bold">Ajouter une ligne</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez une prestation au devis sans quitter l’aperçu.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Désignation
                </label>
                <textarea
                  required
                  value={lineDescription}
                  onChange={(e) => setLineDescription(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground">
                    Quantité
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={lineQuantity}
                    onChange={(e) => setLineQuantity(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">
                    Prix unitaire
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineUnitPrice}
                    onChange={(e) => setLineUnitPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`${primaryButtonClass} w-full`}
              >
                {saving ? "Enregistrement…" : "Ajouter la ligne"}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleUpdateTerms}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
                <Pencil className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[17px] font-bold">Informations du devis</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajustez le titre, le statut et les conditions.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Titre du devis
                </label>
                <input
                  required
                  type="text"
                  value={quoteTitle}
                  onChange={(e) => setQuoteTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Numéro du devis
                </label>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder={quote.id.slice(0, 8)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Statut
                </label>
                <select
                  value={quoteStatus}
                  onChange={(e) => setQuoteStatus(e.target.value)}
                  className={inputClass}
                >
                  {Object.entries(QUOTE_STATUS_LABELS).map(
                    ([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Date de validité
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Conditions de paiement
                </label>
                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Exemple : Paiement à 30 jours après réception de facture."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Mentions légales
                </label>
                <textarea
                  value={legalNotice}
                  onChange={(e) => setLegalNotice(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Exemple : TVA non applicable, article 293 B du CGI."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`${secondaryButtonClass} w-full`}
              >
                {saving ? "Enregistrement…" : "Enregistrer les informations"}
              </button>
            </div>
          </form>
        </aside>
      </div>

      <ConfirmModal
        open={sendConfirmQuote}
        title={
          quote.status === "SENT"
            ? "Confirmer le renvoi du devis"
            : quoteSendFailed
              ? "Réessayer l’envoi du devis"
              : "Confirmer l’envoi du devis"
        }
        description={
          quote.status === "SENT"
            ? "Le devis PDF sera renvoyé par email au prospect. La date d’envoi sera mise à jour si Resend confirme l’envoi."
            : "Le devis PDF sera envoyé par email au prospect. Le statut passera à Envoyé uniquement si Resend confirme l’envoi."
        }
        confirmLabel={quoteSending ? "Envoi…" : "Confirmer l’envoi"}
        loading={quoteSending}
        onCancel={() => setSendConfirmQuote(false)}
        onConfirm={handleSendQuote}
      >
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
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
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(statusConfirmQuote)}
        title={
          statusConfirmQuote === "REJECTED"
            ? "Confirmer le refus du devis"
            : "Confirmer l’annulation du devis"
        }
        description={
          statusConfirmQuote === "REJECTED"
            ? "Le devis sera marqué comme refusé et restera consultable dans l’historique."
            : "Le devis sera marqué comme annulé et ne pourra plus être traité comme actif."
        }
        confirmLabel={saving ? "Mise à jour…" : "Confirmer"}
        loading={saving}
        destructive
        onCancel={() => setStatusConfirmQuote(null)}
        onConfirm={() => {
          if (!statusConfirmQuote) return;
          handleUpdateQuoteStatus(statusConfirmQuote);
        }}
      >
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Devis
          </p>
          <p className="mt-1 font-medium">{quote.title}</p>
          <p className="text-muted-foreground">
            {quote.quoteNumber ?? quote.id.slice(0, 8)}
          </p>
        </div>
      </ConfirmModal>

      {sendConfirmReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 print:hidden">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-lg sm:p-6">
            <h2 className="text-xl font-bold">Confirmer l’envoi</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette relance sera envoyée par email au client du devis.
            </p>

            <div className="mt-4 space-y-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sujet
                </p>
                <p className="mt-1 font-medium">
                  {sendConfirmReminder.subject}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </p>
                <p className="mt-1 max-h-64 overflow-y-auto whitespace-pre-line text-muted-foreground">
                  {sendConfirmReminder.body}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSendConfirmReminder(null)}
                disabled={saving}
                className={secondaryButtonClass}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => handleSendReminder(sendConfirmReminder.id)}
                disabled={saving}
                className={primaryButtonClass}
              >
                <Send className="h-4 w-4" />
                {saving ? "Envoi…" : "Confirmer l’envoi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
