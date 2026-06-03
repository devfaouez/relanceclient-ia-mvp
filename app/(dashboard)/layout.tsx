import { redirect } from "next/navigation";
import { DashboardShellClient } from "@/components/dashboard/dashboard-shell-client";
import { requireCurrentUser, UnauthorizedError } from "@/lib/auth";

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
    <DashboardShellClient
      displayName={displayName}
      displayEmail={displayEmail}
    >
      {children}
    </DashboardShellClient>
  );
}
