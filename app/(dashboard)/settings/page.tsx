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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/status")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des paramètres");
        }
        return res.json() as Promise<SettingsStatus>;
      })
      .then(setStatus)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          État de configuration du compte connecté et de l&apos;envoi email.
        </p>
      </div>

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
