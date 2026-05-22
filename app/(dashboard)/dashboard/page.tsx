"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  Euro,
  FileText,
  Percent,
  Plus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount, formatDate } from "@/lib/formatters";
import {
  prospectStatusLabel,
  quoteStatusLabel,
} from "@/lib/status-labels";

type LatestProspect = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  createdAt: string;
};

type LatestQuote = {
  id: string;
  title: string;
  quoteNumber: string | null;
  status: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  prospect: {
    id: string;
    name: string;
    company: string | null;
  };
};

type LatestReminder = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  quote: {
    id: string;
    title: string;
    quoteNumber: string | null;
    prospect: {
      id: string;
      name: string;
      email?: string | null;
      company: string | null;
    };
  };
};

type DashboardStats = {
  totalProspects: number;
  totalQuotes: number;
  totalQuoteAmount: number;
  sentQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  expiredQuotes: number;
  cancelledQuotes: number;
  totalSentQuoteAmount: number;
  totalAcceptedQuoteAmount: number;
  totalRejectedQuoteAmount: number;
  conversionRate: number;
  acceptanceRate: number;
  pendingReminders: number;
  sentReminders: number;
  scheduledReminders: number;
  failedReminders: number;
  latestProspects: LatestProspect[];
  latestQuotes: LatestQuote[];
  latestPendingReminders: LatestReminder[];
  latestReminders: LatestReminder[];
};

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
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

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 h-52">{children}</div>
    </div>
  );
}

function EmptyChartMessage() {
  return (
    <div className="flex h-full items-center justify-center rounded-md bg-muted/40 text-sm text-muted-foreground">
      Aucune donnée à afficher.
    </div>
  );
}

const chartGridColor = "hsl(var(--border))";
const chartTextColor = "hsl(var(--muted-foreground))";
const chartTooltipStyle = {
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};
const chartGreenPalette = [
  "hsl(var(--primary))",
  "hsl(167 56% 36%)",
  "hsl(158 48% 42%)",
  "hsl(149 38% 50%)",
  "hsl(168 28% 62%)",
];
const chartLegendStyle = {
  color: chartTextColor,
  fontSize: "0.75rem",
};

function compactAmount(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)} k€`;
  }

  return `${value} €`;
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

  const quoteStatusData = [
    { name: "Envoyés", value: stats.sentQuotes },
    { name: "Acceptés", value: stats.acceptedQuotes },
    { name: "Refusés", value: stats.rejectedQuotes },
    { name: "Expirés", value: stats.expiredQuotes },
    { name: "Annulés", value: stats.cancelledQuotes },
  ];

  const quoteAmountData = [
    { name: "Envoyé", value: stats.totalSentQuoteAmount },
    { name: "Accepté", value: stats.totalAcceptedQuoteAmount },
    { name: "Refusé", value: stats.totalRejectedQuoteAmount },
  ];

  const reminderData = [
    { name: "À approuver", value: stats.pendingReminders },
    { name: "Programmées", value: stats.scheduledReminders },
    { name: "Envoyées", value: stats.sentReminders },
    { name: "En échec", value: stats.failedReminders },
  ];

  const hasQuoteStatusData = quoteStatusData.some((item) => item.value > 0);
  const hasQuoteAmountData = quoteAmountData.some((item) => item.value > 0);
  const hasReminderData = reminderData.some((item) => item.value > 0);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vue rapide de vos prospects, devis, montants et relances.
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prospects" value={stats.totalProspects} icon={Users} />
        <StatCard label="Devis" value={stats.totalQuotes} icon={FileText} />
        <StatCard
          label="Montant total des devis"
          value={formatAmount(stats.totalQuoteAmount)}
          icon={Euro}
        />
        <StatCard
          label="Taux d'acceptation"
          value={`${stats.acceptanceRate} %`}
          icon={Percent}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Performance commerciale</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des devis envoyés, acceptés et refusés.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Devis par statut"
            description="Répartition des devis sortis du brouillon."
          >
            {hasQuoteStatusData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [Number(value), "Devis"]}
                  />
                  <Pie
                    dataKey="value"
                    data={quoteStatusData}
                    cx="50%"
                    cy="43%"
                    innerRadius={42}
                    outerRadius={66}
                    paddingAngle={2}
                    nameKey="name"
                    stroke="hsl(var(--card))"
                    strokeWidth={3}
                  >
                    {quoteStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          chartGreenPalette[index % chartGreenPalette.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    verticalAlign="bottom"
                    wrapperStyle={chartLegendStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>

          <ChartCard
            title="Montants des devis"
            description="Volume financier envoyé, accepté et refusé."
          >
            {hasQuoteAmountData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quoteAmountData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
                  barSize={28}
                >
                  <CartesianGrid
                    stroke={chartGridColor}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickFormatter={compactAmount}
                    tickLine={false}
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.45 }}
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [
                      formatAmount(Number(value)),
                      "Montant",
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(167 56% 36%)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Relances</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            État des relances à valider, planifiées, envoyées ou en échec.
          </p>
        </div>

        <ChartCard
          title="Relances par statut"
          description="Vue d'ensemble des relances à traiter et déjà envoyées."
        >
          {hasReminderData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [Number(value), "Relances"]}
                />
                <Pie
                  dataKey="value"
                  data={reminderData}
                  cx="50%"
                  cy="43%"
                  innerRadius={42}
                  outerRadius={66}
                  paddingAngle={2}
                  nameKey="name"
                  stroke="hsl(var(--card))"
                  strokeWidth={3}
                >
                  {reminderData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        chartGreenPalette[index % chartGreenPalette.length]
                      }
                    />
                  ))}
                </Pie>
                <Legend
                  iconSize={8}
                  iconType="circle"
                  verticalAlign="bottom"
                  wrapperStyle={chartLegendStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
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
                        {prospect.company ??
                          prospect.email ??
                          prospect.phone ??
                          "Sans contact"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge label={prospectStatusLabel(prospect.status)} />
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
            <h2 className="font-semibold">5 derniers devis</h2>
          </div>

          {stats.latestQuotes.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              Aucun devis pour l&apos;instant.
            </p>
          ) : (
            <div className="divide-y">
              {stats.latestQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="block px-5 py-4 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{quote.title}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {quote.prospect.company ?? quote.prospect.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {quote.quoteNumber ?? "Sans numéro"} ·{" "}
                        {formatDate(quote.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge label={quoteStatusLabel(quote.status)} />
                      <p className="mt-2 text-sm font-medium">
                        {formatAmount(quote.totalAmount, quote.currency)}
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
            <h2 className="font-semibold">5 relances à approuver</h2>
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
                  href={`/quotes/${reminder.quote.id}`}
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
