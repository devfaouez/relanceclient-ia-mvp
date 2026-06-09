"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  Signature,
  XCircle,
} from "lucide-react";
import {
  reminderToneLabel,
  tradeLabel,
  REMINDER_TONE_LABELS,
  TRADE_LABELS,
} from "@/lib/status-labels";

type SettingsStatus = {
  userEmail: string | null;
  supabaseAuthConfigured: boolean;
  prismaDatabaseSynced: boolean;
  resendApiKeyConfigured: boolean;
  resendFromEmailConfigured: boolean;
  resendFromEmailDisplay: string;
  resendDomainVerified: boolean;
};

type CompanySettings = {
  businessName: string;
  logoUrl: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  trade: string;
  defaultTone: string;
  signatureBlock: string;
  quoteFooter: string;
};

const TRADE_OPTIONS = Object.keys(TRADE_LABELS);
const TONE_OPTIONS = Object.keys(REMINDER_TONE_LABELS);

const cardClass =
  "rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6";

const inputClass =
  "mt-1.5 w-full rounded-[11px] border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-[hsl(var(--emerald-soft))] disabled:opacity-50";

const selectClass =
  "h-[44px] w-full appearance-none rounded-[20px] border border-input bg-card px-4 pr-10 text-sm shadow-[var(--surface-shadow)] outline-none transition focus:border-primary focus:ring-[3px] focus:ring-[hsl(var(--emerald-soft))] disabled:opacity-50";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-semibold leading-none text-primary-foreground shadow-[var(--surface-shadow)] transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50";

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--emerald-soft))] px-2.5 py-1 text-xs font-semibold text-primary"
          : "inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ok ? "Oui" : "Non"}
    </span>
  );
}

function ChecklistItem({ label, ok }: { label: string; ok: boolean }) {
  const Icon = ok ? CheckCircle2 : XCircle;

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
      <span className="flex items-center gap-3 text-sm font-medium">
        <Icon
          className={ok ? "h-5 w-5 text-primary" : "h-5 w-5 text-destructive"}
        />
        {label}
      </span>
      <StatusBadge ok={ok} />
    </li>
  );
}

function Message({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "success" | "error";
}) {
  const Icon = type === "success" ? CheckCircle2 : XCircle;

  return (
    <p
      className={
        type === "success"
          ? "flex items-start gap-2 rounded-2xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] px-4 py-3.5 text-sm font-medium text-primary shadow-[var(--surface-shadow)]"
          : "flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3.5 text-sm font-medium text-destructive shadow-[var(--surface-shadow)]"
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-border pb-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-[17px] font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold">
      {children}
    </label>
  );
}

function SettingsLoadingState() {
  return (
    <section className="space-y-6" aria-busy="true">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
        <p className="text-sm font-medium text-muted-foreground">
          Configuration
        </p>
        <h1 className="mt-1 text-2xl font-bold">Paramètres</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des paramètres...
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl border bg-card shadow-[var(--surface-shadow)]"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border bg-card shadow-[var(--surface-shadow)]" />
      </div>
    </section>
  );
}

function formatApiError(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback;

  const error =
    "error" in json && typeof json.error === "string" ? json.error : fallback;

  if (
    !("details" in json) ||
    !json.details ||
    typeof json.details !== "object"
  ) {
    return error;
  }

  const details = json.details as {
    fieldErrors?: Record<string, string[] | undefined>;
  };
  const fieldMessages = Object.entries(details.fieldErrors ?? {}).flatMap(
    ([field, messages]) =>
      (messages ?? []).map((message) => `${field} : ${message}`),
  );

  return fieldMessages.length > 0
    ? `${error} - ${fieldMessages.join(", ")}`
    : error;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyMessage, setCompanyMessage] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [statusRes, companyRes] = await Promise.all([
          fetch("/api/settings/status"),
          fetch("/api/settings/company"),
        ]);

        if (!statusRes.ok || !companyRes.ok) {
          throw new Error("Erreur lors du chargement des paramètres");
        }

        const statusJson = (await statusRes.json()) as SettingsStatus;
        const companyJson = (await companyRes.json()) as CompanySettings;

        setStatus(statusJson);
        setCompanySettings(companyJson);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Erreur lors du chargement des paramètres",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateCompanyField<K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K],
  ) {
    setCompanySettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  }

  async function handleSaveCompanySettings(e: React.FormEvent) {
    e.preventDefault();

    if (!companySettings) return;

    setSavingCompany(true);
    setCompanyMessage(null);
    setCompanyError(null);

    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companySettings),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setCompanyError(
          formatApiError(json, "Erreur lors de l’enregistrement"),
        );
        return;
      }

      const saved = (await res.json()) as Partial<CompanySettings>;
      setCompanySettings((prev) => ({
        businessName: saved.businessName ?? prev?.businessName ?? "",
        logoUrl: saved.logoUrl ?? prev?.logoUrl ?? "",
        companyAddress: saved.companyAddress ?? prev?.companyAddress ?? "",
        companyPhone: saved.companyPhone ?? prev?.companyPhone ?? "",
        companyEmail: saved.companyEmail ?? prev?.companyEmail ?? "",
        companyWebsite: saved.companyWebsite ?? prev?.companyWebsite ?? "",
        trade: saved.trade ?? prev?.trade ?? "",
        defaultTone: saved.defaultTone ?? prev?.defaultTone ?? "PROFESSIONAL",
        signatureBlock: saved.signatureBlock ?? prev?.signatureBlock ?? "",
        quoteFooter: saved.quoteFooter ?? prev?.quoteFooter ?? "",
      }));
      setCompanyMessage("Paramètres entreprise enregistrés.");
    } catch (e) {
      setCompanyError(
        e instanceof Error ? e.message : "Erreur lors de l’enregistrement",
      );
    } finally {
      setSavingCompany(false);
    }
  }

  if (loading) {
    return <SettingsLoadingState />;
  }

  if (error || !status) {
    return (
      <section className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 shadow-[var(--surface-shadow)]">
        <p className="text-sm font-medium text-muted-foreground">
          Configuration
        </p>
        <h1 className="mt-1 text-2xl font-bold">Paramètres</h1>
        <p className="mt-5 text-sm font-medium text-destructive">
          {error ?? "Impossible de charger les paramètres"}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-[22px]">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--surface-shadow)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold">Configuration entreprise</p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Les modifications s’appliquent aux prochains devis et relances.
          </p>
        </div>

        {companySettings && (
          <button
            type="submit"
            form="company-settings-form"
            disabled={savingCompany}
            className={`${primaryButtonClass} w-full sm:w-auto`}
          >
            {savingCompany ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {savingCompany ? "Enregistrement..." : "Enregistrer"}
          </button>
        )}
      </div>

      {(companyMessage || companyError) && (
        <div className="space-y-3">
          {companyMessage && <Message type="success">{companyMessage}</Message>}
          {companyError && <Message type="error">{companyError}</Message>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {companySettings && (
          <form
            id="company-settings-form"
            onSubmit={handleSaveCompanySettings}
            className="space-y-5"
          >
            <div className={cardClass}>
              <SectionHeading
                icon={Building2}
                title="Profil entreprise"
                description="Ces informations apparaissent sur les devis et dans les emails."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="businessName">
                    Nom de l’entreprise
                  </FieldLabel>
                  <input
                    id="businessName"
                    type="text"
                    value={companySettings.businessName}
                    onChange={(e) =>
                      updateCompanyField("businessName", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="trade">Métier</FieldLabel>
                  <div className="relative mt-1.5">
                    <select
                      id="trade"
                      value={companySettings.trade}
                      onChange={(e) =>
                        updateCompanyField("trade", e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="">Non renseigné</option>
                      {TRADE_OPTIONS.map((trade) => (
                        <option key={trade} value={trade}>
                          {tradeLabel(trade)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="companyPhone">Téléphone</FieldLabel>
                  <input
                    id="companyPhone"
                    type="text"
                    value={companySettings.companyPhone}
                    onChange={(e) =>
                      updateCompanyField("companyPhone", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="companyEmail">
                    Email entreprise
                  </FieldLabel>
                  <input
                    id="companyEmail"
                    type="email"
                    value={companySettings.companyEmail}
                    onChange={(e) =>
                      updateCompanyField("companyEmail", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="companyWebsite">Site web</FieldLabel>
                  <input
                    id="companyWebsite"
                    type="text"
                    value={companySettings.companyWebsite}
                    onChange={(e) =>
                      updateCompanyField("companyWebsite", e.target.value)
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="defaultTone">
                    Ton par défaut des relances
                  </FieldLabel>
                  <div className="relative mt-1.5">
                    <select
                      id="defaultTone"
                      value={companySettings.defaultTone}
                      onChange={(e) =>
                        updateCompanyField("defaultTone", e.target.value)
                      }
                      className={selectClass}
                    >
                      {TONE_OPTIONS.map((tone) => (
                        <option key={tone} value={tone}>
                          {reminderToneLabel(tone)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <FieldLabel htmlFor="companyAddress">Adresse</FieldLabel>
                <textarea
                  id="companyAddress"
                  rows={3}
                  value={companySettings.companyAddress}
                  onChange={(e) =>
                    updateCompanyField("companyAddress", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))]/70 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[14px] border border-[hsl(var(--emerald-soft))] bg-card text-primary shadow-[var(--surface-shadow)]">
                    {companySettings.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={companySettings.logoUrl}
                        alt="Logo entreprise"
                        className="h-full w-full rounded-[14px] bg-white object-contain p-2"
                      />
                    ) : (
                      <ImageIcon className="h-7 w-7" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <FieldLabel htmlFor="logoUrl">URL du logo</FieldLabel>
                    <input
                      id="logoUrl"
                      type="url"
                      value={companySettings.logoUrl}
                      onChange={(e) =>
                        updateCompanyField("logoUrl", e.target.value)
                      }
                      placeholder="https://..."
                      className={inputClass}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Le logo est utilisé dans les aperçus et PDF de devis quand
                      une URL est renseignée.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <SectionHeading
                icon={Signature}
                title="Signature email"
                description="Bloc ajouté aux relances et communications sortantes."
              />

              <FieldLabel htmlFor="signatureBlock">Signature</FieldLabel>
              <textarea
                id="signatureBlock"
                rows={5}
                value={companySettings.signatureBlock}
                onChange={(e) =>
                  updateCompanyField("signatureBlock", e.target.value)
                }
                placeholder={"Cordialement,\nVotre nom\nVotre entreprise"}
                className={inputClass}
              />
            </div>

            <div className={cardClass}>
              <SectionHeading
                icon={FileText}
                title="Préférences de devis"
                description="Texte par défaut affiché en pied de page des devis."
              />

              <FieldLabel htmlFor="quoteFooter">
                Texte de pied de page devis
              </FieldLabel>
              <textarea
                id="quoteFooter"
                rows={4}
                value={companySettings.quoteFooter}
                onChange={(e) =>
                  updateCompanyField("quoteFooter", e.target.value)
                }
                placeholder="Conditions, mentions légales, délai de validité du devis..."
                className={inputClass}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingCompany}
                className={`${primaryButtonClass} w-full sm:w-auto`}
              >
                {savingCompany ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingCompany
                  ? "Enregistrement..."
                  : "Enregistrer les paramètres"}
              </button>
            </div>
          </form>
        )}

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
            <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold">Compte connecté</h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {status.userEmail ?? "Email indisponible"}
                </p>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
                <Settings2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[17px] font-bold">Configuration Resend</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  État de l’expéditeur utilisé pour les emails.
                </p>
              </div>
            </div>
            </div>

            <dl className="space-y-0 border-t border-border bg-[hsl(var(--emerald-tint))]/30 text-sm">
              <div className="px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium">RESEND_API_KEY</dt>
                  <dd>
                    <StatusBadge ok={status.resendApiKeyConfigured} />
                  </dd>
                </div>
              </div>

              <div className="border-t border-border px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-medium">RESEND_FROM_EMAIL</dt>
                  <dd>
                    <StatusBadge ok={status.resendFromEmailConfigured} />
                  </dd>
                </div>
                <p className="mt-2 break-words text-xs text-muted-foreground">
                  {status.resendFromEmailDisplay}
                </p>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-[var(--surface-shadow)]">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-bold">Mode test Resend</h2>
                <p className="mt-2 text-sm leading-6">
                  En mode test Resend, l’envoi est limité à l’email autorisé par
                  Resend. Pour envoyer des relances à tous les clients, un
                  domaine Resend vérifié est nécessaire.
                </p>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[17px] font-bold">Checklist MVP</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Statuts techniques du compte.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              <ChecklistItem
                label="Supabase Auth configuré"
                ok={status.supabaseAuthConfigured}
              />
              <ChecklistItem
                label="Base Prisma synchronisée"
                ok={status.prismaDatabaseSynced}
              />
              <ChecklistItem
                label="Resend configuré"
                ok={status.resendApiKeyConfigured}
              />
              <ChecklistItem
                label="Domaine Resend vérifié"
                ok={status.resendDomainVerified}
              />
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
