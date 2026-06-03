import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  CreditCard,
  FileText,
  LayoutTemplate,
  Mail,
  Settings,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import { requireCurrentUser, UnauthorizedError } from "@/lib/auth";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const pilotageNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/prospects", label: "Prospects", icon: Users },
  { href: "/quotes", label: "Devis", icon: FileText },
  { href: "/reminders", label: "Relances", icon: Mail },
  { href: "/activity", label: "Activité", icon: Activity },
];

const configurationNavigation: NavigationItem[] = [
  { href: "/templates", label: "Modèles", icon: LayoutTemplate },
  { href: "/settings", label: "Paramètres", icon: Settings },
  { href: "/account", label: "Compte", icon: CreditCard },
];

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: NavigationItem[];
}) {
  return (
    <div>
      <p className="hidden px-3 pb-2 pt-4 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-emerald-200/60 lg:block">
        {label}
      </p>
      <nav
        className="flex gap-1 lg:flex-col lg:gap-0.5"
        aria-label={label}
      >
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 whitespace-nowrap rounded-[0.65rem] px-3 py-2 text-sm font-medium text-emerald-50/75 transition hover:bg-white/10 hover:text-white lg:gap-3"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
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

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user;

  try {
    user = await requireCurrentUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw e;
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Utilisateur";
  const displayEmail = user.email ?? "Session active";

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="bg-[linear-gradient(180deg,#07372a_0%,#052a20_100%)] px-4 py-4 text-emerald-50 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-4 lg:py-5">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3 rounded-xl px-2 pb-4 pt-1 text-base font-bold tracking-normal text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[0.65rem] bg-primary text-primary-foreground shadow-sm shadow-black/10">
            <BarChart3 className="h-4 w-4" />
          </span>
          <span className="truncate whitespace-nowrap">RelanceClient IA</span>
        </Link>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:overflow-visible lg:px-0 lg:pb-0">
          <div className="flex shrink-0 gap-2 lg:block">
            <NavGroup label="Pilotage" items={pilotageNavigation} />
          </div>
          <div className="flex shrink-0 gap-2 lg:block">
            <NavGroup label="Configuration" items={configurationNavigation} />
          </div>
        </div>

        <div className="mt-4 hidden lg:mt-auto lg:block lg:pt-5">
          <div className="flex min-w-0 items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3">
            <UserInitials value={displayName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-emerald-100/60">
                {displayEmail}
              </p>
            </div>
          </div>
          <div className="mt-2 rounded-lg px-3 py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:text-emerald-100/65 [&_button]:transition [&_button:hover]:text-white">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Espace de travail
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Pilotage des prospects, devis et relances
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3 lg:hidden">
              <UserInitials value={displayName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
              <div className="shrink-0 rounded-md border bg-card px-3 py-2 shadow-sm [&_button]:text-sm [&_button]:font-medium [&_button]:text-muted-foreground [&_button]:transition [&_button:hover]:text-foreground">
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1180px] px-4 py-6 sm:px-5 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
