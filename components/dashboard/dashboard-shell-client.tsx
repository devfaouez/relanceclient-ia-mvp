"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutTemplate,
  LogOut,
  Mail,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type RouteSection = {
  match: string;
  crumb: string;
  title: string;
  lead: string;
  actions: Array<"reminders" | "new-prospect">;
};

type DashboardShellClientProps = {
  children: ReactNode;
  displayName: string;
  displayEmail: string;
};

const pilotageNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: BarChart3 },
  { href: "/prospects", label: "Prospects", icon: Users },
  { href: "/quotes", label: "Devis", icon: FileText },
  { href: "/reminders", label: "Relances", icon: Mail },
  { href: "/activity", label: "Activité", icon: Activity },
];

const configurationNavigation: NavigationItem[] = [
  { href: "/templates", label: "Modèles", icon: LayoutTemplate },
  { href: "/help", label: "Aide", icon: HelpCircle },
  { href: "/account", label: "Compte", icon: CreditCard },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

const routeSections: RouteSection[] = [
  {
    match: "/prospects/new",
    crumb: "Pilotage",
    title: "Nouveau prospect",
    lead: "Créez une fiche prospect et préparez le suivi commercial.",
    actions: [],
  },
  {
    match: "/dashboard",
    crumb: "Espace de travail",
    title: "Tableau de bord",
    lead: "Vue rapide de vos prospects, devis, montants et relances.",
    actions: ["reminders", "new-prospect"],
  },
  {
    match: "/prospects",
    crumb: "Pilotage",
    title: "Prospects",
    lead: "Liste globale de vos contacts, sociétés et opportunités.",
    actions: ["new-prospect"],
  },
  {
    match: "/quotes",
    crumb: "Pilotage",
    title: "Devis",
    lead: "Liste globale de tous vos devis, prospects liés et montants.",
    actions: ["new-prospect"],
  },
  {
    match: "/reminders",
    crumb: "Pilotage",
    title: "Relances",
    lead: "Relances à valider, planifiées, envoyées ou en attente.",
    actions: [],
  },
  {
    match: "/activity",
    crumb: "Pilotage",
    title: "Activité",
    lead: "Historique récent des actions commerciales et relances.",
    actions: [],
  },
  {
    match: "/templates",
    crumb: "Configuration",
    title: "Modèles",
    lead: "Modèles de relance utilisés pour accélérer vos suivis.",
    actions: [],
  },
  {
    match: "/help",
    crumb: "Configuration",
    title: "Aide",
    lead: "Repères utiles pour prendre en main RelanceClient IA.",
    actions: [],
  },
  {
    match: "/account",
    crumb: "Configuration",
    title: "Compte",
    lead: "Abonnement, accès et informations liées à votre compte.",
    actions: [],
  },
  {
    match: "/settings",
    crumb: "Configuration",
    title: "Paramètres",
    lead: "Profil de votre entreprise, signature et préférences de devis.",
    actions: [],
  },
];

function matchesPath(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function getCurrentSection(pathname: string) {
  return (
    routeSections.find((section) => matchesPath(pathname, section.match)) ??
    routeSections.find((section) => section.match === "/dashboard")!
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavigationItem[];
  pathname: string;
}) {
  return (
    <div>
      <p className="hidden px-3 pb-2 pt-4 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-emerald-200/60 lg:block">
        {label}
      </p>
      <nav className="flex gap-1 lg:flex-col lg:gap-0.5" aria-label={label}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = matchesPath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-[11px] whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium text-emerald-50/75 transition hover:bg-white/10 hover:text-white",
                isActive && "bg-white/[0.13] text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-[17px] w-[17px] shrink-0 opacity-85",
                  isActive && "opacity-100",
                )}
              />
              <span className="nav-label max-lg:hidden">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function UserInitials({ value }: { value: string }) {
  const initials = value
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-primary text-sm font-bold text-primary-foreground shadow-sm">
      {initials || "RC"}
    </span>
  );
}

export function DashboardShellClient({
  children,
  displayName,
  displayEmail,
}: DashboardShellClientProps) {
  const pathname = usePathname();
  const currentSection = getCurrentSection(pathname);
  const visibleActions = new Set(currentSection.actions);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="bg-[linear-gradient(180deg,#07372a_0%,#052a20_100%)] px-[14px] py-3 text-[#d7ece3] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-4 lg:py-[22px]">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-[11px] px-1 pb-3 pr-3 text-[17px] font-bold tracking-normal text-white lg:px-2 lg:pb-[22px] lg:pt-1"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <BarChart3 className="h-[17px] w-[17px]" />
          </span>
          <span className="truncate whitespace-nowrap">RelanceClient IA</span>
        </Link>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:overflow-visible lg:px-0 lg:pb-0">
          <div className="flex shrink-0 gap-2 lg:block">
            <NavGroup
              label="Pilotage"
              items={pilotageNavigation}
              pathname={pathname}
            />
          </div>
          <div className="flex shrink-0 gap-2 lg:block">
            <NavGroup
              label="Configuration"
              items={configurationNavigation}
              pathname={pathname}
            />
          </div>
        </div>

        <div className="mt-4 hidden lg:mt-auto lg:block lg:pt-4">
          <div className="flex min-w-0 items-center gap-[11px] rounded-xl bg-white/[0.06] px-3 py-2.5">
            <UserInitials value={displayName} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                {displayName}
              </p>
              <p className="truncate text-[11.5px] text-[#8fc1ac]">
                {displayEmail}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[#8fc1ac] transition hover:bg-white/10 hover:text-white [&_button]:text-[13px] [&_button]:font-medium [&_button]:text-inherit [&_button]:transition">
            <LogOut className="h-4 w-4 shrink-0" />
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 px-[18px] py-4 backdrop-blur md:px-8 md:py-[18px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-muted-foreground">
                {currentSection.crumb}
              </p>
              <h1 className="mt-0.5 text-[22px] font-bold text-foreground">
                {currentSection.title}
              </h1>
              <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                {currentSection.lead}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 md:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {visibleActions.has("reminders") ? (
                  <Link
                    href="/reminders"
                    className="inline-flex items-center justify-center gap-2 rounded-[11px] border border-input bg-card px-4 py-2.5 text-sm font-semibold leading-none text-foreground shadow-[var(--surface-shadow)] transition hover:border-primary hover:text-primary"
                  >
                    Voir les relances
                  </Link>
                ) : null}
                {visibleActions.has("new-prospect") ? (
                  <Link
                    href="/prospects/new"
                    className="inline-flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-semibold leading-none text-primary-foreground shadow-[var(--surface-shadow)] transition hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Nouveau prospect
                  </Link>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-3 lg:hidden">
                <UserInitials value={displayName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-[10px] border bg-card px-3 py-2 shadow-sm [&_button]:text-sm [&_button]:font-medium [&_button]:text-muted-foreground [&_button]:transition [&_button:hover]:text-foreground">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1180px] px-[18px] py-6 md:px-8 md:py-7 lg:pb-14">
          {children}
        </main>
      </div>
    </div>
  );
}
