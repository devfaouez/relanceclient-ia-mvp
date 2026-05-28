import Link from "next/link";

const sections = [
  {
    title: "Éditeur du service",
    content: [
      "RelanceClient IA est un service SaaS en phase bêta.",
      "Éditeur : [Nom de l’entreprise ou du responsable à compléter]",
      "Statut juridique : [Statut juridique à compléter]",
      "SIRET : [SIRET à compléter si applicable]",
      "Adresse : [Adresse professionnelle à compléter]",
      "Contact : [Email de contact à compléter]",
    ],
  },
  {
    title: "Hébergement",
    content: [
      "Hébergeur : [Nom de l’hébergeur à compléter]",
      "Adresse de l’hébergeur : [Adresse de l’hébergeur à compléter]",
      "Le service peut utiliser des prestataires techniques pour l’authentification, l’envoi d’emails, le paiement et les traitements automatisés.",
    ],
  },
  {
    title: "Responsabilité",
    content: [
      "RelanceClient IA aide les professionnels à gérer leurs prospects, devis, emails et relances.",
      "L’utilisateur reste responsable des informations saisies, des devis transmis et des messages envoyés à ses clients.",
      "Les contenus générés ou assistés par IA doivent être vérifiés avant utilisation.",
    ],
  },
  {
    title: "Propriété intellectuelle",
    content: [
      "Les éléments du service, son interface, ses textes et son fonctionnement sont protégés par les droits applicables.",
      "Toute reproduction ou réutilisation non autorisée est interdite.",
    ],
  },
];

export default function LegalPage() {
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

        <section className="mt-12 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Mentions légales
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Mentions légales
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Ces textes sont une base de travail pour une bêta SaaS. Ils doivent
            être relus, complétés et validés juridiquement avant tout lancement
            public.
          </p>
        </section>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border bg-card p-6">
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
