"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { FileText, MailCheck, Plus, Send, Users } from "lucide-react";

type LatestProspect = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  createdAt: string;
};

type LatestPendingReminder = {
  id: string;
  subject: string;
  createdAt: string;
  quote: {
    id: string;
    title: string;
    quoteNumber: string | null;
    prospect: {
      id: string;
      name: string;
      email: string | null;
      company: string | null;
    };
  };
};

type DashboardStats = {
  totalProspects: number;
  totalQuotes: number;
  pendingReminders: number;
  sentReminders: number;
  latestProspects: LatestProspect[];
  latestPendingReminders: LatestPendingReminder[];
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <span className="rounded-md bg-muted p-2 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du dashboard");
        }
        return res.json() as Promise<DashboardStats>;
      })
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-6 text-sm text-destructive">
          {error ?? "Impossible de charger le dashboard"}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vue rapide de vos prospects, devis et relances en attente de
            validation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/prospects/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nouveau prospect
          </Link>
          <Link
            href="/prospects"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Voir les prospects
          </Link>
          <Link
            href="/reminders"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Voir les relances
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Prospects"
          value={stats.totalProspects}
          icon={Users}
        />
        <StatCard label="Devis" value={stats.totalQuotes} icon={FileText} />
        <StatCard
          label="Relances à approuver"
          value={stats.pendingReminders}
          icon={MailCheck}
        />
        <StatCard
          label="Relances envoyées"
          value={stats.sentReminders}
          icon={Send}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">5 derniers prospects</h2>
          </div>

          {stats.latestProspects.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              Aucun prospect pour l&apos;instant.
            </p>
          ) : (
            <div className="divide-y">
              {stats.latestProspects.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/prospects/${prospect.id}`}
                  className="block px-5 py-4 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{prospect.name}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {prospect.company ?? prospect.email ?? prospect.phone ?? "Sans contact"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        {prospect.status}
                      </span>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(prospect.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">5 dernières relances à approuver</h2>
          </div>

          {stats.latestPendingReminders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              Aucune relance en attente d&apos;approbation.
            </p>
          ) : (
            <div className="divide-y">
              {stats.latestPendingReminders.map((reminder) => (
                <Link
                  key={reminder.id}
                  href={`/prospects/${reminder.quote.prospect.id}`}
                  className="block px-5 py-4 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {reminder.quote.prospect.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {reminder.subject}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        Devis : {reminder.quote.title}
                        {reminder.quote.quoteNumber
                          ? ` #${reminder.quote.quoteNumber}`
                          : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(reminder.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
