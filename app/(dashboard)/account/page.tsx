"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, CreditCard, Loader2 } from "lucide-react";
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
          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          : "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
      }
    >
      {statusLabels[status]}
    </span>
  );
}

function usageValueLabel(used: number, limit: number | null) {
  return limit === null ? "Illimité" : `${used} / ${limit}`;
}

function isNearLimit(used: number, limit: number | null) {
  if (limit === null) return false;

  return used >= Math.floor(limit * 0.8);
}

export default function AccountPage() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
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

  async function startCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
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
          : "Impossible de lancer le paiement Stripe"
      );
      setCheckoutLoading(false);
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
            "Impossible d'ouvrir le portail Stripe. Vérifiez sa configuration."
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
          : "Impossible d'ouvrir le portail Stripe. Vérifiez sa configuration."
      );
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6" aria-busy="true">
        <div>
          <h1 className="text-2xl font-semibold">Compte</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de l&apos;abonnement...
          </p>
        </div>
      </section>
    );
  }

  if (error || !subscription || !usage) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Compte</h1>
        <p className="mt-6 text-sm text-destructive">
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
        usage.maxAiRemindersPerMonth
      ));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compte</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Suivi du plan et de l&apos;abonnement Stripe, sans bloquer
          l&apos;accès pendant la bêta.
        </p>
      </div>

      {paymentSuccess ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Paiement confirmé. L&apos;abonnement sera mis à jour dès réception du
          webhook Stripe.
        </div>
      ) : null}

      {paymentCanceled ? (
        <div className="rounded-md border bg-secondary px-4 py-3 text-sm">
          Paiement annulé. Vous pouvez relancer le checkout à tout moment.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-muted p-2 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Abonnement actuel</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre plan est synchronisé avec les événements Stripe.
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">{planLabels[subscription.plan]}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
              <dt className="text-muted-foreground">Statut</dt>
              <dd>
                <SubscriptionBadge status={subscription.subscriptionStatus} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
              <dt className="text-muted-foreground">Fin de période</dt>
              <dd className="font-medium">
                {formatDate(subscription.currentPeriodEnd)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Gestion Stripe</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Passez au plan Pro via Stripe Checkout, puis gérez votre abonnement
            et vos factures depuis le portail client Stripe.
          </p>

          {subscription.plan === "FREE" ? (
            <button
              type="button"
              onClick={startCheckout}
              disabled={checkoutLoading}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Passer au Pro
            </button>
          ) : (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Gérer l&apos;abonnement
            </button>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            {subscription.plan === "FREE"
              ? "Le checkout ouvre une session Stripe sécurisée."
              : "Le portail Stripe permet de modifier l'abonnement et de consulter les factures."}
          </p>

          {checkoutError ? (
            <p className="mt-3 text-sm text-destructive">{checkoutError}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-muted p-2 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Utilisation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivi des quotas inclus dans votre plan.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border px-4 py-3">
            <dt className="text-sm text-muted-foreground">Devis utilisés</dt>
            <dd className="mt-1 text-lg font-semibold">
              {usageValueLabel(usage.quotesUsed, usage.maxQuotes)}
            </dd>
          </div>
          <div className="rounded-md border px-4 py-3">
            <dt className="text-sm text-muted-foreground">
              Relances IA utilisées ce mois-ci
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {usageValueLabel(
                usage.aiRemindersUsedThisMonth,
                usage.maxAiRemindersPerMonth
              )}
            </dd>
          </div>
        </dl>

        {shouldSuggestPro ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Vous approchez des limites du plan Gratuit. Le plan Pro débloque les
            devis et relances IA en illimité.
          </div>
        ) : null}
      </div>
    </section>
  );
}
