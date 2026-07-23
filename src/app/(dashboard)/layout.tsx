import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth/session";
import { longDateLabel } from "@/lib/dates";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <AppShell session={session} today={longDateLabel(new Date(), session.timezone)}>
      {children}
    </AppShell>
  );
}
