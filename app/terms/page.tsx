import Link from "next/link";

const sections = [
  {
    title: "Objet",
    content: [
      "Les présentes conditions générales d’utilisation encadrent l’accès à RelanceClient IA, un service SaaS en phase bêta destiné au suivi commercial des artisans et petites entreprises.",
      "Le service permet notamment de gérer des prospects, créer des devis PDF, envoyer des emails, préparer des relances assistées par IA et programmer des relances.",
    ],
  },
  {
    title: "Accès au service",
    content: [
      "L’accès au service nécessite la création d’un compte utilisateur.",
      "Certaines fonctionnalités peuvent être limitées selon l’offre utilisée, notamment l’offre Free ou l’offre Pro.",
      "Les limites d’usage peuvent évoluer pendant la phase bêta.",
    ],
  },
  {
    title: "Obligations de l’utilisateur",
    content: [
      "L’utilisateur s’engage à fournir des informations exactes et à utiliser le service dans un cadre professionnel licite.",
      "Il reste responsable des prospects, devis, emails, modèles et relances qu’il crée ou envoie depuis le service.",
      "Il doit vérifier les contenus générés avec l’aide de l’IA avant de les envoyer à ses clients.",
    ],
  },
  {
    title: "Offres et paiement",
    content: [
      "RelanceClient IA peut proposer une offre gratuite avec limites d’usage et une offre payante Pro.",
      "Les paiements, abonnements et annulations sont traités par un prestataire de paiement tiers.",
      "Les informations tarifaires affichées dans l’application prévalent au moment de la souscription.",
    ],
  },
  {
    title: "Disponibilité et bêta",
    content: [
      "Le service est fourni en phase bêta et peut comporter des interruptions, limitations ou modifications.",
      "L’éditeur peut faire évoluer les fonctionnalités, corriger des anomalies ou suspendre temporairement l’accès pour maintenance.",
    ],
  },
  {
    title: "Résiliation",
    content: [
      "L’utilisateur peut cesser d’utiliser le service à tout moment.",
      "Les modalités de suppression de compte et de résiliation d’abonnement doivent être précisées avant le lancement public : [procédure à compléter].",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link className="text-lg font-semibold" href="/">
            RelanceClient IA
          </Link>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
            Retour
          </Link>
        </header>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-[var(--surface-shadow)] sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            CGU
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Conditions générales d’utilisation
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Ces textes sont une base de travail pour une bêta SaaS. Ils doivent
            être relus, complétés et validés juridiquement avant tout lancement
            public.
          </p>
        </section>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--surface-shadow)]"
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {section.content.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
