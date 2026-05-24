"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
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

export default function AccountPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/subscription")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement de l'abonnement");
        }

        return res.json() as Promise<Subscription>;
      })
      .then(setSubscription)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  if (error || !subscription) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Compte</h1>
        <p className="mt-6 text-sm text-destructive">
          {error ?? "Impossible de charger l'abonnement"}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compte</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Suivi du plan et de l&apos;abonnement. Stripe sera activé à l&apos;étape
          suivante, sans bloquer l&apos;accès pendant la bêta.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-muted p-2 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Abonnement actuel</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Base prête pour Stripe, sans paiement actif pour l&apos;instant.
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
            Le checkout Stripe, le portail client et les webhooks ne sont pas
            encore branchés. Cette page prépare l&apos;affichage et l&apos;API
            d&apos;abonnement sans limiter l&apos;application.
          </p>

          <button
            type="button"
            disabled
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
          >
            Gérer l&apos;abonnement
          </button>

          <p className="mt-3 text-xs text-muted-foreground">
            Ce bouton sera relié au portail client Stripe à l&apos;étape
            suivante.
          </p>
        </div>
      </div>
    </section>
  );
}
