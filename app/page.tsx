import Link from "next/link";

const features = [
  {
    title: "Gestion prospects",
    description:
      "Ajoutez rapidement vos prospects avec leur nom, email et entreprise, puis suivez leur statut sans perdre le fil.",
  },
  {
    title: "Création devis PDF",
    description:
      "Générez des devis professionnels en PDF, propres et prêts à être envoyés au client.",
  },
  {
    title: "Envoi par email",
    description:
      "Envoyez vos devis directement depuis l’application, avec le PDF du devis en pièce jointe.",
  },
  {
    title: "Relances IA",
    description:
      "L’IA prépare des messages de relance personnalisés selon le devis, le client et le stade de relance.",
  },
  {
    title: "Relances programmées",
    description:
      "Planifiez vos relances à J+3, J+7 ou J+14, puis validez le message avant l’envoi.",
  },
  {
    title: "Historique / activité",
    description:
      "Gardez un journal complet des envois, relances et réponses pour chaque prospect.",
  },
];

const plans = [
  {
    name: "FREE",
    description: "Idéal pour tester",
    items: ["5 devis", "10 relances IA / mois"],
    highlighted: false,
  },
  {
    name: "PRO",
    description: "Pour suivre chaque opportunité",
    price: "29€/mois HT",
    roi: "Un seul devis converti grâce à une relance rembourse votre abonnement pour l’année.",
    items: [
      "Devis illimités",
      "Relances IA illimitées",
      "Relances programmées",
      "Suivi commercial complet",
    ],
    highlighted: true,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-8 sm:gap-16 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <Link className="text-lg font-semibold" href="/">
            RelanceClient IA
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/login">
              Se connecter
            </Link>
            <Link
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
              href="/register"
            >
              Créer un compte
            </Link>
          </nav>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">
              SaaS pour artisans
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Ne laissez plus vos devis sans réponse.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Vous envoyez des devis et vous oubliez de relancer. RelanceClient
              prépare vos relances, vous validez, on envoie — avec le PDF du
              devis en pièce jointe.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                href="/register"
              >
                Créer un compte
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-md border bg-card px-5 py-3 text-sm font-medium hover:bg-muted"
                href="/login"
              >
                Se connecter
              </Link>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="rounded-md bg-muted/60 p-4">
              <p className="text-sm font-medium text-primary">Pipeline devis</p>
              <div className="mt-4 space-y-3">
                {[
                  ["Prospect qualifié", "Devis envoyé"],
                  ["Relance IA prête", "À valider"],
                  ["Relance programmée", "Demain 09:00"],
                ].map(([label, status]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-md border bg-card px-4 py-3"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border p-4">
                <p className="text-2xl font-semibold">5 min</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  pour préparer une relance
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-2xl font-semibold">24/7</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  suivi des opportunités
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Problème
            </p>
            <p className="mt-3 text-base leading-7 text-foreground sm:text-lg sm:leading-8">
              Vous chiffrez un devis de 4 000€ le dimanche soir. Vous l’envoyez
              le lundi. Le chantier reprend, la semaine file. Quand vous y
              repensez vendredi, le client a déjà signé ailleurs. Pas parce que
              vous étiez trop cher — parce que l’autre a relancé, et pas vous.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Solution
            </p>
            <p className="mt-3 text-base leading-7 text-foreground sm:text-lg sm:leading-8">
              RelanceClient vous rappelle quand relancer, rédige le message, et
              joint le devis en PDF. Vous validez en un clic — le reste est
              automatique.
            </p>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Fonctionnalités
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Tout le suivi commercial au même endroit.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-card p-5">
                <div className="mb-4 h-2 w-12 rounded-full bg-primary" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Tarifs
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Commencez gratuitement, passez en Pro quand le suivi devient clé.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={
                  plan.highlighted
                    ? "rounded-lg border border-primary bg-card p-6 shadow-sm"
                    : "rounded-lg border bg-card p-6"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    {"price" in plan && (
                      <p className="mt-4 text-3xl font-semibold">{plan.price}</p>
                    )}
                  </div>
                  {plan.highlighted && (
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Recommandé
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {"roi" in plan && (
                  <p className="mt-6 text-sm font-medium">{plan.roi}</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 text-center sm:p-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Reprenez le contrôle de vos devis en attente.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            RelanceClient IA aide les artisans à suivre leurs prospects, envoyer
            leurs devis et relancer au bon moment.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              href="/register"
            >
              Créer un compte
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-md border bg-background px-5 py-3 text-sm font-medium hover:bg-muted"
              href="/login"
            >
              Se connecter
            </Link>
          </div>
        </section>

        <footer className="border-t py-6">
          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © 2026 RelanceClient IA — Conçu en France pour les artisans du
              bâtiment.
            </p>
            <nav className="flex flex-wrap gap-4">
              <Link className="hover:text-foreground" href="/legal">
                Mentions légales
              </Link>
              <Link className="hover:text-foreground" href="/terms">
                CGU
              </Link>
              <Link className="hover:text-foreground" href="/privacy">
                Confidentialité
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
