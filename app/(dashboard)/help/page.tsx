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

const betaChecklist = [
  "Paramètres entreprise complétés",
  "Domaine Resend vérifié",
  "Prospect test avec email valide",
  "Devis test créé",
  "PDF vérifié",
  "Devis envoyé",
  "Relance générée",
  "Relance approuvée",
  "Relance envoyée manuellement",
  "Relance programmée testée",
  "Cron testé",
  "Page activité vérifiée",
];

const productionTestSteps = [
  {
    title: "Préparer un vrai scénario de test",
    description:
      "Utilisez une adresse email contrôlée, un prospect test et un devis représentatif.",
    href: "/prospects",
    label: "Créer le prospect",
  },
  {
    title: "Contrôler le devis avant envoi",
    description:
      "Vérifiez les lignes, le montant, les informations entreprise et le rendu PDF.",
    href: "/quotes",
    label: "Ouvrir les devis",
  },
  {
    title: "Tester les deux modes de relance",
    description:
      "Envoyez une relance manuelle, puis programmez une autre relance à court délai.",
    href: "/reminders",
    label: "Tester les relances",
  },
  {
    title: "Vérifier les traces",
    description:
      "Confirmez les statuts, les erreurs éventuelles, le cron et les événements d'activité.",
    href: "/activity",
    label: "Voir l'activité",
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
      className="inline-flex items-center justify-center rounded-[11px] border border-input bg-card px-3.5 py-2 text-sm font-semibold shadow-[var(--surface-shadow)] transition hover:border-primary hover:text-primary"
    >
      {children}
    </Link>
  );
}

export default function HelpPage() {
  return (
    <section className="space-y-[22px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]">
        <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Guide opérationnel
            </p>
            <h2 className="mt-2 text-[22px] font-bold">
              Parcours complet de relance
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Les repères essentiels pour créer un prospect, préparer un devis,
              envoyer le PDF et suivre les relances jusqu&apos;à leur envoi.
            </p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))]/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Démarrage
            </p>
            <p className="mt-2 text-[30px] font-bold leading-none">
              {workflowSteps.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              étapes pour tester le flux complet.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[17px] font-bold">Workflow conseillé</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ordre recommandé pour valider le parcours commercial.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-xl border border-border bg-[hsl(var(--emerald-tint))]/35 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[hsl(var(--emerald-soft))] bg-card text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                        Étape {index + 1}
                      </p>
                      <h3 className="mt-1 break-words text-sm font-bold">
                        {step.title}
                      </h3>
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

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[17px] font-bold">Checklist de démarrage</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pré-requis avant les premiers tests.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {checklist.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-border bg-[hsl(var(--emerald-tint))]/35 p-4"
              >
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-bold">
                      {item.title}
                    </h3>
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

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <h2 className="text-[17px] font-bold">Checklist bêta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            À cocher avant d&apos;inviter les premiers utilisateurs à tester le
            parcours complet.
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {betaChecklist.map((item) => (
              <li
                key={item}
                className="flex gap-2 rounded-xl border border-border bg-[hsl(var(--emerald-tint))]/35 px-3 py-2.5"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 break-words text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <h2 className="text-[17px] font-bold">
            Test de production recommandé
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Faites un test court de bout en bout avec une adresse que vous
            maîtrisez avant d&apos;envoyer à un vrai client.
          </p>

          <div className="mt-4 space-y-3">
            {productionTestSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-[hsl(var(--emerald-tint))]/35 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  Test {index + 1}
                </p>
                <h3 className="mt-1 break-words text-sm font-bold">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
                <Link
                  href={step.href}
                  className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  {step.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[17px] font-bold">Problèmes fréquents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les blocages les plus courants se règlent depuis les prospects,
              les paramètres ou le suivi d&apos;activité.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {frequentIssues.map((issue) => (
            <div
              key={issue.title}
              className="rounded-xl border border-border bg-[hsl(var(--emerald-tint))]/35 p-4"
            >
              <h3 className="break-words text-sm font-bold">{issue.title}</h3>
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

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] text-primary">
            <Settings className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold">Accès rapides</h2>
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
