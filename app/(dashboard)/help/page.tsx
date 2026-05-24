import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Mail,
  Send,
  Settings,
  UserPlus,
} from "lucide-react";

const workflowSteps = [
  {
    title: "Créer un prospect",
    description: "Ajoutez le contact client et son entreprise avant de préparer le devis.",
    href: "/prospects",
    label: "Prospects",
    icon: UserPlus,
  },
  {
    title: "Créer un devis",
    description: "Renseignez les lignes, le montant et les informations utiles au PDF.",
    href: "/quotes",
    label: "Devis",
    icon: FileText,
  },
  {
    title: "Envoyer le devis PDF",
    description: "Envoyez le PDF au prospect depuis la fiche devis quand il est prêt.",
    href: "/quotes",
    label: "Voir les devis",
    icon: Send,
  },
  {
    title: "Générer une relance",
    description: "Créez une proposition de message à partir d'un devis envoyé.",
    href: "/reminders",
    label: "Relances",
    icon: Mail,
  },
  {
    title: "Approuver la relance",
    description: "Relisez le contenu généré et validez uniquement les messages prêts à partir.",
    href: "/reminders",
    label: "À approuver",
    icon: CheckCircle2,
  },
  {
    title: "Envoyer ou programmer",
    description: "Envoyez immédiatement ou planifiez une relance selon le contexte client.",
    href: "/reminders",
    label: "Planifier",
    icon: Send,
  },
  {
    title: "Suivre l'activité",
    description: "Contrôlez les derniers envois, les relances et les changements de statut.",
    href: "/activity",
    label: "Activité",
    icon: Activity,
  },
];

const checklist = [
  {
    title: "Compléter les paramètres entreprise",
    description: "Nom, email, téléphone, signature et pied de page devis.",
    href: "/settings",
  },
  {
    title: "Vérifier la configuration Resend",
    description: "La clé API et l'adresse d'envoi doivent être présentes.",
    href: "/settings",
  },
  {
    title: "Créer ou vérifier les modèles",
    description: "Les modèles actifs servent de base aux relances.",
    href: "/templates",
  },
  {
    title: "Ajouter un prospect avec email",
    description: "Un email est nécessaire pour envoyer devis et relances.",
    href: "/prospects",
  },
];

const frequentIssues = [
  {
    title: "Prospect sans email",
    description: "Ajoutez une adresse email au prospect avant l'envoi d'un devis ou d'une relance.",
    href: "/prospects",
    label: "Corriger le prospect",
  },
  {
    title: "Configuration Resend manquante",
    description: "Vérifiez RESEND_API_KEY, RESEND_FROM_EMAIL et la vérification du domaine.",
    href: "/settings",
    label: "Ouvrir les paramètres",
  },
  {
    title: "Cron Vercel Hobby limité",
    description: "Sur l'offre Hobby, les déclenchements cron sont limités. Gardez une marge sur les horaires programmés.",
    href: "/settings",
    label: "Voir la configuration",
  },
  {
    title: "Relance programmée non envoyée",
    description: "Contrôlez son statut, l'heure programmée, la configuration email et les événements d'activité.",
    href: "/activity",
    label: "Voir l'activité",
  },
];

function InternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
    >
      {children}
    </Link>
  );
}

export default function HelpPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Aide</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Parcours rapide pour créer un devis, envoyer le PDF puis suivre les
            relances jusqu&apos;à leur envoi.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Retour dashboard
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Workflow conseillé</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-md bg-muted p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Étape {index + 1}
                      </p>
                      <h3 className="mt-1 font-medium">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                      <Link
                        href={step.href}
                        className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                      >
                        {step.label}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Checklist de démarrage</h2>
          <ul className="mt-4 space-y-3">
            {checklist.map((item) => (
              <li key={item.title} className="rounded-md border p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <Link
                      href={item.href}
                      className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold">Problèmes fréquents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les blocages les plus courants se règlent depuis les prospects,
              les paramètres ou le suivi d&apos;activité.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {frequentIssues.map((issue) => (
            <div key={issue.title} className="rounded-md border p-4">
              <h3 className="font-medium">{issue.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {issue.description}
              </p>
              <Link
                href={issue.href}
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                {issue.label}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-muted p-2 text-primary">
            <Settings className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Accès rapides</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Retrouvez les pages utiles du parcours commercial.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <InternalLink href="/prospects">Prospects</InternalLink>
          <InternalLink href="/quotes">Devis</InternalLink>
          <InternalLink href="/reminders">Relances</InternalLink>
          <InternalLink href="/templates">Modèles</InternalLink>
          <InternalLink href="/settings">Paramètres</InternalLink>
          <InternalLink href="/activity">Activité</InternalLink>
        </div>
      </div>
    </section>
  );
}
