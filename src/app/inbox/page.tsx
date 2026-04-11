import { requireSessionUser } from "@/lib/require-session";
import { AppShell } from "@/components/AppShell";
import { InboxScanner } from "@/components/InboxScanner";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await requireSessionUser();

  return (
    <AppShell userEmail={user.email} userName={user.name ?? undefined}>
      <div className="stagger space-y-8">
        <header>
          <div className="stat-label">Inbox scanner</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Triage every email.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/60">
            ClearSAR fetches the most recent messages from your Outlook inbox
            and classifies each one as a SAR or not. Add the real ones to your
            queue with a click.
          </p>
        </header>

        <InboxScanner />
      </div>
    </AppShell>
  );
}
