"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

type Subscription = {
  plan: "FREE" | "PRO";
  subscriptionStatus:
    | "INACTIVE"
    | "TRIALING"
    | "ACTIVE"
    | "PAST_DUE"
    | "CANCELED";
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type Usage = {
  plan: "FREE" | "PRO";
  subscriptionStatus: Subscription["subscriptionStatus"];
  quotesUsed: number;
  maxQuotes: number | null;
  aiRemindersUsedThisMonth: number;
  maxAiRemindersPerMonth: number | null;
};

type BillingCycle = "monthly" | "yearly";

const planLabels: Record<Subscription["plan"], string> = {
  FREE: "Gratuit",
  PRO: "Pro",
};

const statusLabels: Record<Subscription["subscriptionStatus"], string> = {
  INACTIVE: "Inactif",
  TRIALING: "Essai",
  ACTIVE: "Actif",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Annulé",
};

const cardClass =
  "rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-semibold leading-none text-primary-foreground shadow-[var(--surface-shadow)] transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border border-input bg-card px-4 py-2.5 text-sm font-semibold leading-none transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

function SubscriptionBadge({
  status,
}: {
  status: Subscription["subscriptionStatus"];
}) {
  const isActive = status === "ACTIVE" || status === "TRIALING";

  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--emerald-soft))] px-2.5 py-1 text-xs font-semibold text-primary"
          : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

function usageValueLabel(used: number, limit: number | null) {
  return limit === null ? "Illimité" : `${used} / ${limit}`;
}

function usagePercent(used: number, limit: number | null) {
  if (limit === null || limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

function isNearLimit(used: number, limit: number | null) {
  if (limit === null) return false;

  return used >= Math.floor(limit * 0.8);
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const percent = usagePercent(used, limit);
  const unlimited = limit === null;

  return (
    <div className="rounded-2xl border border-border bg-[hsl(var(--emerald-tint))]/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-2 text-[28px] font-bold leading-none text-primary">
            {usageValueLabel(used, limit)}
          </dd>
        </div>
        {unlimited && (
          <span className="rounded-full bg-[hsl(var(--emerald-soft))] px-2.5 py-1 text-xs font-semibold text-primary">
            Pro
          </span>
        )}
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[hsl(var(--emerald-soft))]">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function FeedbackMessage({
  tone,
  children,
}: {
  tone: "success" | "neutral" | "warning" | "error";
  children: React.ReactNode;
}) {
  const className =
    tone === "success"
      ? "border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted/50 text-foreground";

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 text-sm font-medium shadow-[var(--surface-shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function AccountPage() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<BillingCycle | null>(
    null,
  );
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const paymentSuccess = searchParams.get("success") === "1";
  const paymentCanceled = searchParams.get("canceled") === "1";

  useEffect(() => {
    Promise.all([
      fetch("/api/account/subscription").then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement de l'abonnement");
        }

        return res.json() as Promise<Subscription>;
      }),
      fetch("/api/account/usage").then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement de l'utilisation");
        }

        return res.json() as Promise<Usage>;
      }),
    ])
      .then(([subscriptionData, usageData]) => {
        setSubscription(subscriptionData);
        setUsage(usageData);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function startCheckout(billingCycle: BillingCycle) {
    setCheckoutError(null);
    setCheckoutLoading(billingCycle);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ billingCycle }),
      });

      if (!response.ok) {
        throw new Error("Impossible de lancer le paiement Stripe");
      }

      const data = (await response.json()) as { url?: string };

      if (!data.url) {
        throw new Error("URL Stripe manquante");
      }

      window.location.href = data.url;
    } catch (e) {
      setCheckoutError(
        e instanceof Error
          ? e.message
          : "Impossible de lancer le paiement Stripe",
      );
      setCheckoutLoading(null);
    }
  }

  async function openBillingPortal() {
    setCheckoutError(null);
    setPortalLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Impossible d'ouvrir le portail Stripe. Vérifiez sa configuration.",
        );
      }

      if (!data.url) {
        throw new Error("URL du portail Stripe manquante");
      }

      window.location.href = data.url;
    } catch (e) {
      setCheckoutError(
        e instanceof Error
          ? e.message
          : "Impossible d'ouvrir le portail Stripe. Vérifiez sa configuration.",
      );
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6" aria-busy="true">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)]">
          <p className="text-sm font-medium text-muted-foreground">
            Facturation
          </p>
          <h1 className="mt-1 text-2xl font-bold">Compte</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de l&apos;abonnement...
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl border bg-card shadow-[var(--surface-shadow)]" />
          <div className="h-72 animate-pulse rounded-2xl border bg-card shadow-[var(--surface-shadow)]" />
        </div>
      </section>
    );
  }

  if (error || !subscription || !usage) {
    return (
      <section className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 shadow-[var(--surface-shadow)]">
        <p className="text-sm font-medium text-muted-foreground">Facturation</p>
        <h1 className="mt-1 text-2xl font-bold">Compte</h1>
        <p className="mt-5 text-sm font-medium text-destructive">
          {error ?? "Impossible de charger l'abonnement"}
        </p>
      </section>
    );
  }

  const shouldSuggestPro =
    usage.plan === "FREE" &&
    (isNearLimit(usage.quotesUsed, usage.maxQuotes) ||
      isNearLimit(
        usage.aiRemindersUsedThisMonth,
        usage.maxAiRemindersPerMonth,
      ));

  return (
    <section className="space-y-[22px]">
      <div className="space-y-3">
        {paymentSuccess ? (
          <FeedbackMessage tone="success">
            Paiement confirmé. L&apos;abonnement sera mis à jour dès réception
            du webhook Stripe.
          </FeedbackMessage>
        ) : null}

        {paymentCanceled ? (
          <FeedbackMessage tone="neutral">
            Paiement annulé. Vous pouvez relancer le checkout à tout moment.
          </FeedbackMessage>
        ) : null}

        {checkoutError ? (
          <FeedbackMessage tone="error">{checkoutError}</FeedbackMessage>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
          <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
                <CreditCard className="h-[22px] w-[22px]" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Plan actuel
                </p>
                <h2 className="mt-1 text-[32px] font-bold leading-none text-primary">
                  {planLabels[subscription.plan]}
                </h2>
              </div>
            </div>

            <SubscriptionBadge status={subscription.subscriptionStatus} />
          </div>

          <div className="grid border-t border-border bg-[hsl(var(--emerald-tint))]/35 sm:grid-cols-3">
            <div className="px-5 py-4 sm:px-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Statut
              </p>
              <p className="mt-2 text-sm font-semibold">
                {statusLabels[subscription.subscriptionStatus]}
              </p>
            </div>

            <div className="border-t border-border px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fin de période
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>

            <div className="border-t border-border px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Synchronisation
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Stripe
              </p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} flex flex-col`}>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold">Gestion Stripe</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Checkout sécurisé pour passer Pro, portail client pour gérer
                l’abonnement et les factures.
              </p>
            </div>
          </div>

          <div className="mt-auto">
            {subscription.plan === "FREE" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <button
                  type="button"
                  onClick={() => startCheckout("monthly")}
                  disabled={checkoutLoading !== null}
                  className={primaryButtonClass}
                >
                  {checkoutLoading === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  Pro mensuel
                </button>
                <button
                  type="button"
                  onClick={() => startCheckout("yearly")}
                  disabled={checkoutLoading !== null}
                  className={secondaryButtonClass}
                >
                  {checkoutLoading === "yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  Pro annuel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openBillingPortal}
                disabled={portalLoading}
                className={`mt-5 w-full ${primaryButtonClass} sm:w-auto lg:w-full`}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
                Gérer l&apos;abonnement
              </button>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              {subscription.plan === "FREE"
                ? "Le checkout ouvre une session Stripe sécurisée."
                : "Le portail Stripe permet de modifier l'abonnement et de consulter les factures."}
            </p>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[17px] font-bold">Utilisation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Suivi des quotas inclus dans votre plan.
              </p>
            </div>
          </div>
          <SubscriptionBadge status={usage.subscriptionStatus} />
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <UsageCard
            label="Devis utilisés"
            used={usage.quotesUsed}
            limit={usage.maxQuotes}
          />
          <UsageCard
            label="Relances IA utilisées ce mois-ci"
            used={usage.aiRemindersUsedThisMonth}
            limit={usage.maxAiRemindersPerMonth}
          />
        </dl>

        {shouldSuggestPro ? (
          <div className="mt-4">
            <FeedbackMessage tone="warning">
              Vous approchez des limites du plan Gratuit. Le plan Pro débloque
              les devis et relances IA en illimité.
            </FeedbackMessage>
          </div>
        ) : null}
      </div>
    </section>
  );
}
