"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Euro,
  FileText,
  Inbox,
  Percent,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
    <div className="min-h-[150px] rounded-2xl border border-border bg-card px-5 py-5 shadow-[0_1px_2px_rgba(7,55,42,0.06),0_1px_1px_rgba(7,55,42,0.04)]">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[150px] text-[13px] font-medium leading-5 text-muted-foreground">
            {label}
          </p>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
            <Icon className="h-[23px] w-[23px]" />
          </span>
        </div>

        <div className="min-w-0">
          <p
            className={`break-words text-[clamp(30px,3.4vw,38px)] font-bold leading-none tracking-normal ${
              accent ? "text-primary" : ""
            }`}
          >
            {value}
          </p>
          {helper && (
            <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
          )}
        </div>
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
      return "bg-[#e3eef3] text-[#2f6f8f]";
    case "DRAFT":
    case "NEW":
    case "PENDING_APPROVAL":
      return "bg-[#faf0df] text-[#9a6a1e]";
    case "CANCELLED":
    case "EXPIRED":
    case "FAILED":
    case "LOST":
    case "REJECTED":
      return "bg-[#fbeceb] text-destructive";
    default:
      return "bg-[#eef1ef] text-muted-foreground";
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

function PanelCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-[22px] shadow-[0_14px_40px_-18px_rgba(7,55,42,0.18),0_1px_2px_rgba(7,55,42,0.06)]">
      <div>
        <h3 className="text-[15px] font-bold">{title}</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
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
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-4 py-7 text-center">
      <span className="grid h-[46px] w-[46px] place-items-center rounded-[13px] border border-[hsl(var(--emerald-soft))] bg-card text-primary">
        <Inbox className="h-[22px] w-[22px]" />
      </span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {href && actionLabel && (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-[11px] border border-input bg-card px-3.5 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
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
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "green" | "red";
}) {
  const toneClasses = {
    amber: {
      text: "text-[#d68a2e]",
      border: "border-l-primary",
    },
    blue: {
      text: "text-[#2f6f8f]",
      border: "border-l-input",
    },
    green: {
      text: "text-primary",
      border: "border-l-input",
    },
    red: {
      text: "text-destructive",
      border: "border-l-input",
    },
  }[tone];

  return (
    <div className={`min-w-0 border-l-2 pl-3.5 ${toneClasses.border}`}>
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-[clamp(25px,3vw,32px)] font-bold leading-none tracking-normal ${toneClasses.text}`}
      >
        {value}
      </p>
    </div>
  );
}

function DonutLegend({
  data,
  total,
}: {
  data: Array<{ name: string; value: number }>;
  total: number;
}) {
  return (
    <div className="grid gap-2.5 text-[13px]">
      {data.map((item, index) => (
        <div key={item.name} className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{
              backgroundColor:
                chartGreenPalette[index % chartGreenPalette.length],
            }}
          />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {item.name}
          </span>
          <span className="font-semibold text-foreground">{item.value}</span>
        </div>
      ))}
      <div className="mt-1 border-t border-border pt-2 text-xs text-muted-foreground">
        Total affiché : <span className="font-semibold text-foreground">{total}</span>
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
  "#2f9c78",
  "#5cae8e",
  "#8fc7b1",
  "#c2ddd2",
];

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
      <section className="space-y-[22px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[122px] animate-pulse rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]"
            />
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card px-6 py-[22px] shadow-[var(--surface-shadow)]">
          <p className="text-sm font-medium text-muted-foreground">
            Chargement du tableau de bord…
          </p>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section>
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13.5px] font-medium text-destructive">
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
  const totalVisibleQuoteStatuses = quoteStatusData.reduce(
    (total, item) => total + item.value,
    0,
  );
  const totalVisibleReminders = reminderData.reduce(
    (total, item) => total + item.value,
    0,
  );

  return (
    <section className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

      <div>
        <SectionHeading
          title="Performance commerciale"
          description="Suivi des devis envoyés, acceptés et refusés."
        />

        <div className="mt-3.5 grid gap-5 xl:grid-cols-2">
          <PanelCard
            title="Devis par statut"
            description="Répartition des devis sortis du brouillon."
          >
            {hasQuoteStatusData ? (
              <div className="mt-5 grid items-center gap-6 sm:grid-cols-[190px_1fr]">
                <div className="relative h-[178px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value) => [Number(value), "Devis"]}
                      />
                      <Pie
                        dataKey="value"
                        data={quoteStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={2}
                        nameKey="name"
                        stroke="hsl(var(--card))"
                        strokeWidth={4}
                      >
                        {quoteStatusData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              chartGreenPalette[
                                index % chartGreenPalette.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="text-[24px] font-bold leading-none">
                        {totalVisibleQuoteStatuses}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        devis
                      </div>
                    </div>
                  </div>
                </div>
                <DonutLegend
                  data={quoteStatusData}
                  total={totalVisibleQuoteStatuses}
                />
              </div>
            ) : (
              <EmptyState
                title="Aucun devis envoyé"
                description="Envoyez un premier devis PDF pour visualiser la répartition par statut."
                href="/quotes"
                actionLabel="Voir les devis"
              />
            )}
          </PanelCard>

          <PanelCard
            title="Montants des devis"
            description="Volume financier envoyé, accepté et refusé."
          >
            {hasQuoteAmountData ? (
              <div className="mt-5 h-[190px] px-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={quoteAmountData}
                    margin={{ top: 26, right: 8, bottom: 0, left: 0 }}
                    barSize={46}
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
                      hide
                      tickFormatter={compactAmount}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--emerald-tint))", opacity: 0.8 }}
                      contentStyle={chartTooltipStyle}
                      formatter={(value) => [
                        formatAmount(Number(value)),
                        "Montant",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                    >
                      {quoteAmountData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            chartGreenPalette[index % chartGreenPalette.length]
                          }
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(value) => compactAmount(Number(value ?? 0))}
                        fill="#364740"
                        fontSize={12}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="Aucun montant à comparer"
                description="Les volumes apparaîtront dès qu'un devis sera envoyé, accepté ou refusé."
                href="/quotes"
                actionLabel="Préparer un devis"
              />
            )}
          </PanelCard>
        </div>
      </div>

      <div>
        <SectionHeading
          title="Relances"
          description="État des relances à valider, planifiées, envoyées ou en échec."
        />

        <div className="mt-3.5 rounded-2xl border border-border bg-card px-6 py-[22px] shadow-[0_14px_40px_-18px_rgba(7,55,42,0.18),0_1px_2px_rgba(7,55,42,0.06)]">
          <div className="grid items-center gap-7 xl:grid-cols-[1fr_310px]">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <ReminderMetric
                label="À approuver"
                value={stats.pendingReminders}
                tone="amber"
              />
              <ReminderMetric
                label="Programmées"
                value={stats.scheduledReminders}
                tone="blue"
              />
              <ReminderMetric
                label="Envoyées"
                value={stats.sentReminders}
                tone="green"
              />
              <ReminderMetric
                label="En échec"
                value={stats.failedReminders}
                tone="red"
              />
            </div>

            {hasReminderData ? (
              <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr] xl:grid-cols-[132px_1fr]">
                <div className="relative h-[132px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value) => [Number(value), "Relances"]}
                      />
                      <Pie
                        dataKey="value"
                        data={reminderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={56}
                        paddingAngle={2}
                        nameKey="name"
                        stroke="hsl(var(--card))"
                        strokeWidth={3}
                      >
                        {reminderData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              chartGreenPalette[
                                index % chartGreenPalette.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="text-[20px] font-bold leading-none">
                        {totalVisibleReminders}
                      </div>
                      <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                        relances
                      </div>
                    </div>
                  </div>
                </div>
                <DonutLegend data={reminderData} total={totalVisibleReminders} />
              </div>
            ) : (
              <div className="min-h-[132px]">
                <EmptyState
                  title="Aucune relance suivie"
                  description="Générez une relance depuis un devis pour suivre les validations et les envois."
                  href="/reminders"
                  actionLabel="Voir les relances"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
          <div className="border-b border-border px-5 py-4">
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
            <div className="space-y-2 p-2.5">
              {stats.latestProspects.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/prospects/${prospect.id}`}
                  className="block rounded-xl border border-border bg-card px-3 py-2.5 transition hover:border-[hsl(var(--emerald-soft))] hover:bg-[hsl(var(--emerald-tint))]"
                >
                  <div className="flex items-center justify-between gap-3">
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
                      <p className="mt-1.5 text-xs text-muted-foreground">
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
          <div className="border-b border-border px-5 py-4">
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
            <div className="space-y-2 p-2.5">
              {stats.latestQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="block rounded-xl border border-border bg-card px-3 py-2.5 transition hover:border-[hsl(var(--emerald-soft))] hover:bg-[hsl(var(--emerald-tint))]"
                >
                  <div className="flex items-start justify-between gap-3">
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
                      <p className="mt-1.5 text-sm font-semibold">
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
          <div className="border-b border-border px-5 py-4">
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
            <div className="space-y-2 p-2.5">
              {stats.latestPendingReminders.map((reminder) => (
                <Link
                  key={reminder.id}
                  href={`/quotes/${reminder.quote.id}`}
                  className="block rounded-xl border border-border bg-card px-3 py-2.5 transition hover:border-[hsl(var(--emerald-soft))] hover:bg-[hsl(var(--emerald-tint))]"
                >
                  <div className="flex items-start justify-between gap-3">
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
                      <p className="mt-1.5 text-xs text-muted-foreground">
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
