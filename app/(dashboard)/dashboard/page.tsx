"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  Inbox,
  Percent,
  Plus,
  Users,
  XCircle,
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
  helper,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-1.5 truncate text-3xl font-bold leading-none ${
              accent ? "text-primary" : ""
            }`}
          >
            {value}
          </p>
          {helper && (
            <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
          )}
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function statusTone(status: string) {
  switch (status) {
    case "ACCEPTED":
    case "QUALIFIED":
    case "SENT":
    case "WON":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "APPROVED":
    case "CONTACTED":
    case "SCHEDULED":
      return "bg-sky-50 text-sky-700";
    case "DRAFT":
    case "NEW":
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700";
    case "CANCELLED":
    case "EXPIRED":
    case "FAILED":
    case "LOST":
    case "REJECTED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(
        status,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
      <div>
        <h3 className="text-[15px] font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 h-48">{children}</div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-4 py-8 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-card text-primary">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {href && actionLabel && (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          {actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-[17px] font-bold">{title}</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
    </div>
  );
}

function ReminderMetric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "green" | "red";
  icon: ComponentType<{ className?: string }>;
}) {
  const toneClasses = {
    amber: {
      text: "text-amber-700",
      box: "border-amber-200 text-amber-700 bg-amber-50",
    },
    blue: {
      text: "text-sky-700",
      box: "border-sky-200 text-sky-700 bg-sky-50",
    },
    green: {
      text: "text-primary",
      box: "border-[hsl(var(--emerald-soft))] text-primary bg-[hsl(var(--emerald-tint))]",
    },
    red: {
      text: "text-red-700",
      box: "border-red-200 text-red-700 bg-red-50",
    },
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-1 text-3xl font-bold leading-none ${toneClasses.text}`}
          >
            {value}
          </p>
        </div>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl border ${toneClasses.box}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
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
      <section className="space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Espace de travail
          </p>
          <h1 className="mt-1 text-2xl font-bold">Tableau de bord</h1>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--surface-shadow)]">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Espace de travail
          </p>
          <h1 className="mt-1 text-2xl font-bold">Tableau de bord</h1>
        </div>
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm font-medium text-destructive">
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
    <section className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Espace de travail
          </p>
          <h1 className="mt-1 text-2xl font-bold">Tableau de bord</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Vue rapide de vos prospects, devis, montants et relances.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/prospects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--surface-shadow)] hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nouveau prospect
          </Link>
          <Link
            href="/prospects"
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold shadow-[var(--surface-shadow)] hover:border-primary hover:text-primary"
          >
            Voir les prospects
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/reminders"
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold shadow-[var(--surface-shadow)] hover:border-primary hover:text-primary"
          >
            Voir les relances
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Prospects"
          value={stats.totalProspects}
          helper="Contacts enregistrés"
          icon={Users}
        />
        <StatCard
          label="Devis"
          value={stats.totalQuotes}
          helper={`${stats.sentQuotes} envoyé${
            stats.sentQuotes > 1 ? "s" : ""
          }`}
          icon={FileText}
        />
        <StatCard
          label="Montant total des devis"
          value={formatAmount(stats.totalQuoteAmount)}
          helper="Tous statuts confondus"
          icon={Euro}
          accent
        />
        <StatCard
          label="Taux d'acceptation"
          value={`${stats.acceptanceRate} %`}
          helper="Sur les devis sortis du brouillon"
          icon={Percent}
          accent
        />
      </div>

      <div className="space-y-3.5">
        <SectionHeading
          title="Performance commerciale"
          description="Suivi des devis envoyés, acceptés et refusés."
        />

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
                    innerRadius={36}
                    outerRadius={58}
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
              <EmptyState
                title="Aucun devis envoyé"
                description="Envoyez un premier devis PDF pour visualiser la répartition par statut."
                href="/quotes"
                actionLabel="Voir les devis"
              />
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
                  barSize={24}
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
              <EmptyState
                title="Aucun montant à comparer"
                description="Les volumes apparaîtront dès qu'un devis sera envoyé, accepté ou refusé."
                href="/quotes"
                actionLabel="Préparer un devis"
              />
            )}
          </ChartCard>
        </div>
      </div>

      <div className="space-y-3.5">
        <SectionHeading
          title="Relances"
          description="État des relances à valider, planifiées, envoyées ou en échec."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReminderMetric
            label="À approuver"
            value={stats.pendingReminders}
            tone="amber"
            icon={Clock}
          />
          <ReminderMetric
            label="Programmées"
            value={stats.scheduledReminders}
            tone="blue"
            icon={Bell}
          />
          <ReminderMetric
            label="Envoyées"
            value={stats.sentReminders}
            tone="green"
            icon={CheckCircle2}
          />
          <ReminderMetric
            label="En échec"
            value={stats.failedReminders}
            tone="red"
            icon={XCircle}
          />
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
                  innerRadius={36}
                  outerRadius={58}
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
            <EmptyState
              title="Aucune relance suivie"
              description="Générez une relance depuis un devis pour suivre les validations et les envois."
              href="/reminders"
              actionLabel="Voir les relances"
            />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
          <div className="border-b bg-[hsl(var(--emerald-tint))]/45 px-5 py-4">
            <h2 className="text-[15px] font-bold">5 derniers prospects</h2>
          </div>

          {stats.latestProspects.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Aucun prospect"
                description="Créez un premier contact pour démarrer le workflow de devis."
                href="/prospects/new"
                actionLabel="Nouveau prospect"
              />
            </div>
          ) : (
            <div className="divide-y">
              {stats.latestProspects.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/prospects/${prospect.id}`}
                  className="block px-5 py-4 transition hover:bg-[hsl(var(--emerald-tint))]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {prospect.name}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">
                        {prospect.company ??
                          prospect.email ??
                          prospect.phone ??
                          "Sans contact"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge
                        label={prospectStatusLabel(prospect.status)}
                        status={prospect.status}
                      />
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

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
          <div className="border-b bg-[hsl(var(--emerald-tint))]/45 px-5 py-4">
            <h2 className="text-[15px] font-bold">5 derniers devis</h2>
          </div>

          {stats.latestQuotes.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Aucun devis"
                description="Les derniers devis créés apparaîtront ici."
                href="/quotes"
                actionLabel="Voir les devis"
              />
            </div>
          ) : (
            <div className="divide-y">
              {stats.latestQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="block px-5 py-4 transition hover:bg-[hsl(var(--emerald-tint))]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {quote.title}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">
                        {quote.prospect.company ?? quote.prospect.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {quote.quoteNumber ?? "Sans numéro"} ·{" "}
                        {formatDate(quote.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge
                        label={quoteStatusLabel(quote.status)}
                        status={quote.status}
                      />
                      <p className="mt-2 text-sm font-semibold">
                        {formatAmount(quote.totalAmount, quote.currency)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
          <div className="border-b bg-[hsl(var(--emerald-tint))]/45 px-5 py-4">
            <h2 className="text-[15px] font-bold">5 relances à approuver</h2>
          </div>

          {stats.latestPendingReminders.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Aucune relance à approuver"
                description="Les relances générées en attente de validation seront listées ici."
                href="/reminders"
                actionLabel="Voir les relances"
              />
            </div>
          ) : (
            <div className="divide-y">
              {stats.latestPendingReminders.map((reminder) => (
                <Link
                  key={reminder.id}
                  href={`/quotes/${reminder.quote.id}`}
                  className="block px-5 py-4 transition hover:bg-[hsl(var(--emerald-tint))]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {reminder.quote.prospect.name}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">
                        {reminder.subject}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        Devis : {reminder.quote.title}
                        {reminder.quote.quoteNumber
                          ? ` #${reminder.quote.quoteNumber}`
                          : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge
                        label="À approuver"
                        status={reminder.status}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(reminder.createdAt)}
                      </p>
                    </div>
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
