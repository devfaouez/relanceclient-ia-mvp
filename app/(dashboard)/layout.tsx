import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { requireCurrentUser, UnauthorizedError } from "@/lib/auth";

const navigation = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/prospects", label: "Prospects" },
  { href: "/reminders", label: "Relances" },
  { href: "/settings", label: "Paramètres" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireCurrentUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw e;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link className="font-semibold" href="/dashboard">
            RelanceClient IA
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {navigation.map((item) => (
              <Link
                key={item.href}
                className="hover:text-foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
