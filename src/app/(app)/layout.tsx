import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const displayName = user.name?.trim() || user.email;

  return (
    <AppShell displayName={displayName} email={user.email ?? ""}>
      {children}
    </AppShell>
  );
}