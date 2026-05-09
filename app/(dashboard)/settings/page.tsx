"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, XCircle } from "lucide-react";

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
  signatureBlock: string;
  quoteFooter: string;
};

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          : "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
      }
    >
      {ok ? "Oui" : "Non"}
    </span>
  );
}

function ChecklistItem({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  const Icon = ok ? CheckCircle2 : XCircle;

  return (
    <li className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
      <span className="flex items-center gap-3 text-sm">
        <Icon
          className={ok ? "h-5 w-5 text-primary" : "h-5 w-5 text-destructive"}
        />
        {label}
      </span>
      <StatusBadge ok={ok} />
    </li>
  );
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
            : "Erreur lors du chargement des paramètres"
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateCompanyField<K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K]
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

    const res = await fetch("/api/settings/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companySettings),
    });

    setSavingCompany(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setCompanyError(
        (json as { error?: string }).error ??
          "Erreur lors de l’enregistrement"
      );
      return;
    }

    const saved = (await res.json()) as CompanySettings;
    setCompanySettings({
      businessName: saved.businessName ?? "",
      logoUrl: saved.logoUrl ?? "",
      companyAddress: saved.companyAddress ?? "",
      companyPhone: saved.companyPhone ?? "",
      companyEmail: saved.companyEmail ?? "",
      companyWebsite: saved.companyWebsite ?? "",
      signatureBlock: saved.signatureBlock ?? "",
      quoteFooter: saved.quoteFooter ?? "",
    });
    setCompanyMessage("Paramètres entreprise enregistrés");
  }

  if (loading) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
      </section>
    );
  }

  if (error || !status) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="mt-6 text-sm text-destructive">
          {error ?? "Impossible de charger les paramètres"}
        </p>
      </section>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          État de configuration du compte connecté et de l&apos;envoi email.
        </p>
      </div>

      {companySettings && (
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Paramètres entreprise</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ces informations seront utilisées pour les devis, les relances et la
            signature email.
          </p>

          <form
            onSubmit={handleSaveCompanySettings}
            className="mt-5 space-y-5"
          >
            {companyMessage && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {companyMessage}
              </p>
            )}

            {companyError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {companyError}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium">
                  Nom de l’entreprise
                </label>
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
                <label htmlFor="logoUrl" className="block text-sm font-medium">
                  URL du logo
                </label>
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
              </div>

              <div>
                <label htmlFor="companyPhone" className="block text-sm font-medium">
                  Téléphone
                </label>
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
                <label htmlFor="companyEmail" className="block text-sm font-medium">
                  Email entreprise
                </label>
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
                <label htmlFor="companyWebsite" className="block text-sm font-medium">
                  Site web
                </label>
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
            </div>

            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium">
                Adresse
              </label>
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

            <div>
              <label htmlFor="signatureBlock" className="block text-sm font-medium">
                Signature email
              </label>
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

            <div>
              <label htmlFor="quoteFooter" className="block text-sm font-medium">
                Texte de pied de page devis
              </label>
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

            {companySettings.logoUrl && (
              <div className="rounded-md border bg-muted/30 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Aperçu du logo
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companySettings.logoUrl}
                  alt="Logo entreprise"
                  className="max-h-20 max-w-60 rounded bg-white object-contain p-2"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={savingCompany}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {savingCompany ? "Enregistrement…" : "Enregistrer les paramètres"}
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-muted p-2 text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Compte connecté</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {status.userEmail ?? "Email indisponible"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Configuration Resend</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">RESEND_API_KEY configurée</dt>
              <dd>
                <StatusBadge ok={status.resendApiKeyConfigured} />
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">
                RESEND_FROM_EMAIL configuré
              </dt>
              <dd className="text-right">
                <StatusBadge ok={status.resendFromEmailConfigured} />
                <p className="mt-2 max-w-64 break-words text-xs text-muted-foreground">
                  {status.resendFromEmailDisplay}
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold">Limite du mode test Resend</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              En mode test Resend, l&apos;envoi est limité à l&apos;email
              autorisé par Resend. Pour envoyer des relances à tous les clients,
              il faut vérifier un domaine Resend et utiliser une adresse
              expéditrice associée à ce domaine.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Checklist MVP</h2>
        <ul className="mt-4 space-y-3">
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
    </section>
  );
}
