import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  Check,
  Clock3,
  FileText,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestion des prospects",
    description:
      "Ajoutez vos prospects et suivez leur statut : à relancer, relancé, en négociation, gagné ou perdu.",
  },
  {
    icon: FileText,
    title: "Devis en PDF",
    description:
      "Générez des devis propres, prêts à être envoyés et joints automatiquement aux relances.",
  },
  {
    icon: Mail,
    title: "Envoi par email",
    description:
      "Envoyez devis et relances depuis l'application, avec le PDF en pièce jointe.",
  },
  {
    icon: Sparkles,
    title: "Relances rédigées par l'IA",
    description:
      "Un message clair selon le client, le montant et le délai. Vous évitez la page blanche.",
  },
  {
    icon: CalendarCheck,
    title: "Relances programmées",
    description:
      "Planifiez à J+3, J+7 ou J+14. L'application vous indique quand agir.",
  },
  {
    icon: Clock3,
    title: "Historique complet",
    description:
      "Retrouvez les devis envoyés, relances préparées, validations et actions réalisées.",
  },
];

const steps = [
  {
    title: "Ajoutez le prospect",
    description:
      "Nom, email, montant du devis et date d'envoi. C'est prêt en moins d'une minute.",
  },
  {
    title: "La relance est préparée",
    description:
      "RelanceClient rédige un message adapté au délai : J+3, J+7 ou J+14.",
  },
  {
    title: "Vous validez",
    description:
      "Vous relisez, vous ajustez si besoin. Aucun email ne part sans votre accord.",
  },
  {
    title: "Le devis repart avec l'email",
    description:
      "Le client reçoit une relance propre avec le devis en PDF en pièce jointe.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    description: "Pour tester sur vos premiers devis.",
    price: "0 €",
    period: "/ mois",
    note: "Sans carte bancaire",
    cta: "Créer un compte gratuit",
    href: "/register",
    features: [
      "5 devis",
      "10 relances IA par mois",
      "Validation avant chaque envoi",
      "Tableau de bord",
    ],
  },
  {
    name: "Pro mensuel",
    description: "Pour suivre vos opportunités sans engagement.",
    price: "29 €",
    period: "/ mois HT",
    note: "Résiliable à tout moment",
    cta: "Démarrer en Pro",
    href: "/register",
    highlighted: true,
    features: [
      "Devis illimités",
      "Relances IA illimitées",
      "Relances programmées",
      "Historique commercial complet",
      "Suivi commercial complet",
    ],
  },
  {
    name: "Pro annuel",
    description: "Pour payer moins cher quand le suivi devient une habitude.",
    price: "290 €",
    period: "/ an HT",
    note: "2 mois offerts",
    cta: "Choisir l'annuel",
    href: "/register",
    features: [
      "Tout le Pro mensuel",
      "Économie de 58 € par an",
      "Devis illimités",
      "Relances IA illimitées",
      "Suivi complet toute l'année",
    ],
  },
];

const situations = [
  {
    title: "Le devis envoyé puis oublié",
    description:
      "Le chantier reprend, les urgences passent devant, et personne ne relance le client au bon moment.",
    label: "Suivi",
  },
  {
    title: "La relance repoussée",
    description:
      "Vous savez qu'il faudrait appeler ou écrire, mais vous manquez de temps pour formuler un message propre.",
    label: "Relance",
  },
  {
    title: "Le client encore hésitant",
    description:
      "Une relance claire peut remettre le devis dans la discussion sans forcer la main au client.",
    label: "Client",
  },
];

function Eyebrow({ children, center = false }: { children: string; center?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#0a7457] ${
        center ? "justify-center" : ""
      }`}
    >
      <span className="h-0.5 w-[22px] rounded-full bg-[#0d8a66]" />
      {children}
    </span>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
  large = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "dark";
  large?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-semibold transition hover:-translate-y-0.5";
  const size = large ? "px-7 py-4 text-base" : "px-5 py-3 text-[15px]";
  const variants = {
    primary:
      "border-transparent bg-[#0d8a66] text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_1px_2px_rgba(7,55,42,0.06)] hover:bg-[#0a7457] hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)]",
    ghost:
      "border-[#cdd8d2] bg-white text-[#15201c] hover:border-[#0d8a66] hover:text-[#0a5f48]",
    dark: "border-transparent bg-white text-[#07372a] hover:bg-[#eafaf3]",
  };

  return (
    <Link className={`${base} ${size} ${variants[variant]}`} href={href}>
      {children}
    </Link>
  );
}

function ProductMockup() {
  const prospects = [
    ["MD", "Martin Dupont", "Devis 3 500 € · J+7", "Relance prête", "ready"],
    ["SB", "Sophie Bernard", "Devis 2 800 € · J+3", "Relance prête", "ready"],
    ["LF", "Léon & Fils", "Devis 5 200 € · J+14", "Programmée", "wait"],
  ];

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[20px] border border-[#e2e9e5] bg-white shadow-[0_40px_90px_-30px_rgba(7,55,42,0.4),0_12px_30px_-12px_rgba(7,55,42,0.18)]">
        <div className="flex items-center gap-2 border-b border-[#e2e9e5] bg-[#fbfcfb] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e7857c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e9c46a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#8bcdaf]" />
          <span className="ml-auto inline-flex items-center gap-2 text-[11.5px] font-semibold text-[#5d6f68]">
            <BarChart3 className="h-3.5 w-3.5" />
            Tableau de bord
          </span>
        </div>
        <div className="p-4 sm:p-[18px]">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ["12", "Devis en cours"],
              ["38 400 €", "CA potentiel"],
              ["5", "À relancer"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-[#e7f3ee] bg-[#f1f8f5] px-3 py-3"
              >
                <p className="[font-family:var(--font-display)] text-[clamp(17px,3vw,21px)] font-bold leading-none tracking-normal text-[#0a5f48]">
                  {value}
                </p>
                <p className="mt-1 text-[10.5px] font-medium leading-tight text-[#5d6f68]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="mb-3.5 mt-4 flex items-center justify-between gap-3">
            <p className="[font-family:var(--font-display)] text-[15px] font-bold text-[#15201c]">
              Mes actions du jour
            </p>
            <span className="rounded-full bg-[#f8ece1] px-2.5 py-1 text-[11px] font-semibold text-[#c2622c]">
              3 prêtes
            </span>
          </div>
          <div className="space-y-2.5">
            {prospects.map(([initials, name, meta, status, state]) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-xl border border-[#e2e9e5] bg-white px-3 py-3"
              >
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#e7f3ee] text-[12.5px] font-bold text-[#0a5f48]">
                  {initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-[#15201c]">
                    {name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-[#5d6f68]">
                    {meta}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                    state === "ready"
                      ? "bg-[#0d8a66] text-white"
                      : "bg-[#f3f0e7] text-[#9a7b3e]"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e2e9e5] bg-white p-4 shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)] sm:absolute sm:-bottom-9 sm:-right-6 sm:mt-0 sm:w-[290px] sm:shadow-[0_40px_90px_-30px_rgba(7,55,42,0.4),0_12px_30px_-12px_rgba(7,55,42,0.18)]">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e7f3ee] text-[#0a5f48]">
            <Mail className="h-4 w-4" />
          </span>
          <span>
            <span className="block [font-family:var(--font-display)] text-xs font-bold text-[#15201c]">
              Relance prête à valider
            </span>
            <span className="block text-[10.5px] text-[#5d6f68]">
              Pour Martin Dupont · J+7
            </span>
          </span>
        </div>
        <div className="rounded-[10px] border border-[#e7f3ee] bg-[#f1f8f5] px-3 py-2.5 text-[11.5px] leading-5 text-[#364740]">
          <strong className="mb-1 block text-[#15201c]">
            Objet : Votre devis — une question ?
          </strong>
          Bonjour Martin, suite à mon devis du 18/04, je reste disponible si
          vous avez la moindre question...
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="rounded-[9px] border border-[#cdd8d2] bg-white px-3 py-2 text-center text-[11.5px] font-semibold text-[#364740]">
            Modifier
          </span>
          <span className="rounded-[9px] bg-[#0d8a66] px-3 py-2 text-center text-[11.5px] font-semibold text-white">
            Valider
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f8f7] text-[#15201c]">
      <header className="sticky top-0 z-50 border-b border-transparent bg-[#f6f8f7]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1180px] items-center justify-between gap-5 px-6 sm:px-7">
          <Link
            className="inline-flex min-w-0 items-center gap-[11px] [font-family:var(--font-display)] text-lg font-bold text-[#15201c]"
            href="/"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[linear-gradient(150deg,#0d8a66_0%,#0a5f48_100%)] text-white shadow-[0_1px_2px_rgba(7,55,42,0.06)]">
              <BarChart3 className="h-[17px] w-[17px]" />
            </span>
            <span className="truncate">RelanceClient IA</span>
          </Link>

          <nav className="hidden items-center gap-8 text-[14.5px] font-medium text-[#364740] lg:flex">
            <Link className="hover:text-[#0a5f48]" href="#probleme">
              Le problème
            </Link>
            <Link className="hover:text-[#0a5f48]" href="#methode">
              Comment ça marche
            </Link>
            <Link className="hover:text-[#0a5f48]" href="#fonctions">
              Fonctionnalités
            </Link>
            <Link className="hover:text-[#0a5f48]" href="#tarifs">
              Tarifs
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link
              className="hidden text-[14.5px] font-semibold text-[#364740] hover:text-[#0a5f48] sm:inline"
              href="/login"
            >
              Se connecter
            </Link>
            <ButtonLink href="/register">Essayer gratuitement</ButtonLink>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1180px] gap-11 px-6 pb-16 pt-[72px] sm:px-7 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-[60px]">
        <div>
          <Eyebrow>Suivi de devis & relances pour artisans</Eyebrow>
          <h1 className="mt-5 [font-family:var(--font-display)] text-[clamp(40px,5.4vw,62px)] font-extrabold leading-[1.04] tracking-normal text-[#15201c]">
            Ne laissez plus jamais un{" "}
            <span className="text-[#0d8a66] sm:whitespace-nowrap">
              devis s&apos;endormir
            </span>
            .
          </h1>
          <p className="mt-5 max-w-[540px] text-[clamp(17px,1.5vw,20px)] leading-[1.55] text-[#364740]">
            Vous chiffrez, vous envoyez, puis le chantier reprend et vous
            oubliez de relancer. RelanceClient prépare la relance au bon moment,
            vous la validez en un clic, et on l&apos;envoie avec le devis en PDF.
          </p>
          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <ButtonLink href="/register" large>
              Essayer gratuitement
              <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink href="#methode" variant="ghost" large>
              Voir comment ça marche
            </ButtonLink>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-medium text-[#5d6f68]">
            <Check className="h-4 w-4 shrink-0 text-[#0d8a66]" />
            Sans carte bancaire · vous gardez la main sur chaque envoi
          </p>
          <div className="mt-9 flex flex-wrap gap-5 border-t border-[#e2e9e5] pt-6">
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#5d6f68]">
              <ShieldCheck className="h-4 w-4 text-[#0a7457]" />
              Vous validez chaque relance avant l&apos;envoi
            </span>
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#5d6f68]">
              <Check className="h-4 w-4 text-[#0a7457]" />
              Aucun email envoyé sans votre validation
            </span>
          </div>
        </div>

        <ProductMockup />
      </section>

      <section className="bg-[#f4efe6] py-[78px]" id="probleme">
        <div className="mx-auto max-w-[1180px] px-6 sm:px-7">
          <div className="mb-11">
            <Eyebrow>Le vrai problème</Eyebrow>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
            <div>
              <p className="[font-family:var(--font-display)] text-[clamp(19px,2vw,23px)] font-medium leading-[1.5] text-[#15201c]">
                Vous chiffrez un devis de{" "}
                <span className="text-[#c2622c]">4 000 €</span> le dimanche
                soir. Vous l&apos;envoyez le lundi. Le chantier reprend, la semaine
                file. Quand vous y repensez le vendredi, le client a déjà signé
                ailleurs.
              </p>
              <p className="mt-5 text-base leading-[1.6] text-[#364740]">
                Pas parce que vous étiez trop cher. Parce que l&apos;autre a relancé,
                et pas vous. Entre deux urgences, la relance devient le truc
                qu&apos;on repousse toujours. RelanceClient comble exactement ce
                trou.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e2e9e5] bg-white p-6 shadow-[0_1px_2px_rgba(7,55,42,0.06)] sm:p-[26px]">
              <p className="[font-family:var(--font-display)] text-[clamp(34px,5vw,48px)] font-extrabold leading-none tracking-normal text-[#c2622c]">
                Devis en attente
              </p>
              <p className="mt-2.5 text-[14.5px] text-[#364740]">
                Quand le suivi dépend seulement de votre mémoire, les
                opportunités les plus chaudes peuvent rester sans réponse.
              </p>
              <div className="mt-5 grid gap-3.5 border-t border-[#e2e9e5] pt-5">
                {[
                  [
                    "Sans réponse",
                    "Des devis restent sans réponse quand personne ne relance.",
                  ],
                  [
                    "Discussion",
                    "Une relance claire peut remettre le client dans la discussion.",
                  ],
                  [
                    "Suivi",
                    "Un suivi régulier évite d'oublier les opportunités chaudes.",
                  ],
                ].map(([value, label]) => (
                  <div key={value} className="flex gap-3">
                    <span className="min-w-[92px] [font-family:var(--font-display)] text-[17px] font-bold text-[#0d8a66]">
                      {value}
                    </span>
                    <span className="text-[13.5px] leading-snug text-[#364740]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-[78px] sm:px-7" id="methode">
        <div className="mb-11 max-w-[660px]">
          <Eyebrow>Comment ça marche</Eyebrow>
          <h2 className="mt-4 [font-family:var(--font-display)] text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.08] tracking-normal">
            De l&apos;envoi du devis au chantier signé, en quatre gestes simples.
          </h2>
          <p className="mt-3.5 text-[17px] leading-[1.55] text-[#364740]">
            Pas de formation, pas de CRM lourd. Vous gardez la main du début à
            la fin.
          </p>
        </div>
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article
              className="rounded-2xl border border-[#e2e9e5] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(7,55,42,0.06)] transition hover:-translate-y-1 hover:border-[#e7f3ee] hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)]"
              key={step.title}
            >
              <span className="mb-4 grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[#e7f3ee] [font-family:var(--font-display)] text-[13px] font-bold text-[#0d8a66]">
                {index + 1}
              </span>
              <h3 className="[font-family:var(--font-display)] text-[17px] font-bold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.5] text-[#364740]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-[78px] sm:px-7" id="fonctions">
        <div className="mb-11 max-w-[660px]">
          <Eyebrow>Fonctionnalités</Eyebrow>
          <h2 className="mt-4 [font-family:var(--font-display)] text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.08] tracking-normal">
            Tout le suivi commercial au même endroit.
          </h2>
          <p className="mt-3.5 text-[17px] leading-[1.55] text-[#364740]">
            Conçu pour le vocabulaire et le quotidien des artisans du bâtiment,
            pas pour des commerciaux.
          </p>
        </div>
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                className="rounded-2xl border border-[#e2e9e5] bg-white p-6 shadow-[0_1px_2px_rgba(7,55,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)]"
                key={feature.title}
              >
                <span className="mb-[18px] grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-[#e7f3ee] bg-[#f1f8f5] text-[#0a5f48]">
                  <Icon className="h-[21px] w-[21px]" />
                </span>
                <h3 className="[font-family:var(--font-display)] text-[17px] font-bold">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-[1.55] text-[#364740]">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-[78px] sm:px-7">
        <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#07372a_0%,#052a20_100%)] px-6 py-10 text-white shadow-[0_40px_90px_-30px_rgba(7,55,42,0.4)] sm:px-12 sm:py-14">
          <Eyebrow>Le calcul est vite fait</Eyebrow>
          <h2 className="mt-3.5 max-w-[680px] [font-family:var(--font-display)] text-[clamp(26px,3vw,36px)] font-bold leading-[1.1] tracking-normal">
            Un seul devis converti grâce à une relance rembourse votre
            abonnement pour toute l&apos;année.
          </h2>
          <div className="mt-10 grid gap-7 md:grid-cols-3">
            {[
              [
                "Suivi",
                "Un suivi régulier évite d'oublier les opportunités chaudes.",
              ],
              [
                "Relance",
                "Une relance claire peut remettre le client dans la discussion.",
              ],
              [
                "ROI",
                "Un seul devis converti grâce à une relance rembourse l'abonnement.",
              ],
            ].map(([value, label]) => (
              <div
                key={value}
                className="border-l-2 border-[#6fd3ae]/40 pl-5"
              >
                <p className="[font-family:var(--font-display)] text-[clamp(38px,5vw,52px)] font-extrabold leading-none tracking-normal">
                  {value}
                </p>
                <p className="mt-3 text-sm leading-[1.45] text-[#e7f3ee]/80">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-[78px] sm:px-7">
        <div className="mx-auto mb-11 max-w-[660px] text-center">
          <Eyebrow center>Ce que ça évite</Eyebrow>
          <h2 className="mt-4 [font-family:var(--font-display)] text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.08] tracking-normal">
            Moins d&apos;oublis, plus de devis suivis proprement.
          </h2>
        </div>
        <div className="grid gap-[18px] lg:grid-cols-3">
          {situations.map((situation) => (
            <article
              className="flex flex-col rounded-2xl border border-[#e2e9e5] bg-white p-6 shadow-[0_1px_2px_rgba(7,55,42,0.06)]"
              key={situation.title}
            >
              <span className="mb-4 grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-[#e7f3ee] bg-[#f1f8f5] text-[#0a5f48]">
                <Check className="h-[21px] w-[21px]" />
              </span>
              <h3 className="[font-family:var(--font-display)] text-[17px] font-bold">
                {situation.title}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-[1.55] text-[#364740]">
                {situation.description}
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-[#e2e9e5] pt-5">
                <span className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-[#0d8a66] [font-family:var(--font-display)] text-[15px] font-bold text-white">
                  {situation.label.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <span className="block text-[14.5px] font-semibold">
                    {situation.label}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-[#5d6f68]">
                    Situation fréquente
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-[78px] sm:px-7" id="tarifs">
        <div className="mx-auto mb-11 max-w-[660px] text-center">
          <Eyebrow center>Tarifs</Eyebrow>
          <h2 className="mt-4 [font-family:var(--font-display)] text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.08] tracking-normal">
            Commencez gratuitement. Passez en Pro quand ça rapporte.
          </h2>
          <p className="mt-3.5 text-[17px] leading-[1.55] text-[#364740]">
            Sans commission sur vos devis gagnés. Vous choisissez mensuel ou annuel.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              className={`relative flex flex-col rounded-[20px] p-7 ${
                plan.highlighted
                  ? "border border-transparent bg-[linear-gradient(165deg,#07372a,#052a20)] text-white shadow-[0_40px_90px_-30px_rgba(7,55,42,0.4),0_12px_30px_-12px_rgba(7,55,42,0.18)]"
                  : "border border-[#e2e9e5] bg-white text-[#15201c] shadow-[0_1px_2px_rgba(7,55,42,0.06)]"
              }`}
              key={plan.name}
            >
              {plan.highlighted ? (
                <span className="absolute right-5 top-5 rounded-full bg-[#0d8a66] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
                  Recommandé
                </span>
              ) : null}
              <p
                className={`[font-family:var(--font-display)] text-sm font-bold uppercase tracking-[0.08em] ${
                  plan.highlighted ? "text-[#6fd3ae]" : "text-[#15201c]"
                }`}
              >
                {plan.name}
              </p>
              <p
                className={`mt-1.5 text-sm ${
                  plan.highlighted ? "text-[#e7f3ee]/80" : "text-[#5d6f68]"
                }`}
              >
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="[font-family:var(--font-display)] text-[46px] font-extrabold leading-none tracking-normal">
                  {plan.price}
                </span>
                <span
                  className={`text-sm ${
                    plan.highlighted ? "text-[#e7f3ee]/80" : "text-[#5d6f68]"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`mt-2 text-[13px] ${
                  plan.highlighted
                    ? "font-medium text-[#6fd3ae]"
                    : "text-[#5d6f68]"
                }`}
              >
                {plan.note}
              </p>
              <ul className="mt-6 grid flex-1 gap-3.5">
                {plan.features.map((item) => (
                  <li className="flex gap-3 text-[14.5px]" key={item}>
                    <Check
                      className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                        plan.highlighted ? "text-[#6fd3ae]" : "text-[#0d8a66]"
                      }`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <ButtonLink
                  href={plan.href}
                  variant={plan.highlighted ? "dark" : "ghost"}
                >
                  {plan.cta}
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-5 max-w-[880px] text-center text-sm text-[#5d6f68]">
          Un seul devis converti grâce à une relance rembourse l&apos;abonnement.
        </p>
      </section>

      <section className="px-6 pb-[90px] sm:px-7">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[28px] border border-[#e2e9e5] bg-white px-6 py-12 text-center shadow-[0_14px_40px_-18px_rgba(7,55,42,0.28)] sm:px-10 sm:py-[60px]">
          <h2 className="mx-auto max-w-[680px] [font-family:var(--font-display)] text-[clamp(30px,4vw,46px)] font-bold leading-[1.08] tracking-normal">
            Reprenez le contrôle de vos devis en attente.
          </h2>
          <p className="mx-auto mt-4 max-w-[540px] text-[17px] leading-[1.55] text-[#364740]">
            Vos prochains chantiers sont peut-être déjà dans votre boîte mail.
            Il manque juste une relance.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
            <ButtonLink href="/register" large>
              Essayer gratuitement
              <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink href="#methode" variant="ghost" large>
              Voir comment ça marche
            </ButtonLink>
          </div>
          <p className="mt-4 inline-flex items-center justify-center gap-2 text-[13.5px] font-medium text-[#5d6f68]">
            <Check className="h-4 w-4 shrink-0 text-[#0d8a66]" />
            Sans carte bancaire · vous gardez la main sur chaque envoi.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#e2e9e5] py-10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-6 text-[13.5px] text-[#5d6f68] sm:px-7 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[520px] leading-6">
            © 2026 RelanceClient IA — Conçu en France pour les artisans du
            bâtiment.
          </p>
          <nav className="flex flex-wrap gap-5 font-medium text-[#364740]">
            <Link className="hover:text-[#0a5f48]" href="/legal">
              Mentions légales
            </Link>
            <Link className="hover:text-[#0a5f48]" href="/terms">
              CGU
            </Link>
            <Link className="hover:text-[#0a5f48]" href="/privacy">
              Confidentialité
            </Link>
            <Link className="hover:text-[#0a5f48]" href="#tarifs">
              Tarifs
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
