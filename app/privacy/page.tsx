import Link from "next/link";

const sections = [
  {
    title: "Données collectées",
    content: [
      "RelanceClient IA peut collecter les données nécessaires à la création du compte, notamment l’adresse email et les informations d’authentification gérées par un prestataire spécialisé.",
      "L’utilisateur peut renseigner des données de prospects, devis, entreprises clientes, emails, modèles, relances et historiques d’activité.",
      "Des données techniques peuvent être collectées pour sécuriser le service, mesurer son usage et corriger les anomalies.",
    ],
  },
  {
    title: "Finalités",
    content: [
      "Les données sont utilisées pour fournir le service, gérer les comptes, générer les devis, envoyer les emails, préparer les relances IA, programmer les relances et suivre l’activité commerciale.",
      "Elles peuvent aussi être utilisées pour assurer la sécurité, le support et l’amélioration du service pendant la bêta.",
    ],
  },
  {
    title: "IA et contenus",
    content: [
      "Certaines fonctionnalités utilisent une assistance par intelligence artificielle pour proposer des contenus de relance.",
      "L’utilisateur doit éviter de saisir des informations sensibles inutiles et vérifier les contenus générés avant envoi.",
      "Les prestataires IA utilisés doivent être précisés avant lancement public : [prestataire IA à compléter].",
    ],
  },
  {
    title: "Prestataires",
    content: [
      "Le service peut s’appuyer sur des prestataires pour l’hébergement, l’authentification, l’envoi d’emails, le paiement et les traitements IA.",
      "Liste des prestataires à compléter : [hébergeur], [authentification], [email], [paiement], [IA].",
    ],
  },
  {
    title: "Durée de conservation",
    content: [
      "Les données sont conservées pendant la durée nécessaire à l’utilisation du service et au respect des obligations applicables.",
      "Les durées précises de conservation doivent être définies avant lancement public : [durées à compléter].",
    ],
  },
  {
    title: "Droits des utilisateurs",
    content: [
      "Selon la réglementation applicable, l’utilisateur peut demander l’accès, la rectification, l’effacement ou la limitation du traitement de ses données.",
      "Contact pour les demandes liées aux données personnelles : [Email de contact à compléter].",
    ],
  },
];

export default function PrivacyPage() {
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
            Confidentialité
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Politique de confidentialité
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
