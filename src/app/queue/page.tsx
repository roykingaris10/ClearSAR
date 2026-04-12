import Link from "next/link";
import { requireSessionUser } from "@/lib/require-session";
import { prisma } from "@/lib/db";
import { daysOverdue, daysUntilDue, formatUkDate } from "@/lib/deadlines";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const user = await requireSessionUser();

  const sars = await prisma.sar.findMany({
    where: { userId: user.id },
    orderBy: { dueDate: "asc" },
  });

  return (
    <AppShell userEmail={user.email} userName={user.name ?? undefined}>
      <div className="stagger space-y-8">
        <header className="flex items-end justify-between">
          <div>
            <div className="stat-label">SAR queue</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
              {sars.length} request{sars.length === 1 ? "" : "s"}
            </h1>
          </div>
          <Link href="/inbox" className="pill pill-secondary text-sm">
            Scan more
          </Link>
        </header>

        {sars.length === 0 ? (
          <div className="card text-center">
            <p className="text-sm text-ink-muted">
              Your queue is empty. Scan your inbox to add SARs.
            </p>
            <Link href="/inbox" className="pill pill-primary mt-4 text-sm">
              Open Inbox Scanner
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink/[0.06] bg-white/70 shadow-card backdrop-blur-xl">
            <div className="grid grid-cols-12 gap-4 border-b border-ink/[0.06] bg-white/60 px-6 py-4 text-[11px] uppercase tracking-[0.12em] text-ink-subtle">
              <div className="col-span-4">Requester</div>
              <div className="col-span-2">Received</div>
              <div className="col-span-2">Due</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Deadline</div>
            </div>
            <div className="divide-y divide-ink/[0.04]">
              {sars.map((s) => {
                const overdue = daysOverdue(s.dueDate);
                const until = daysUntilDue(s.dueDate);
                const isOverdue = overdue > 0;
                return (
                  <Link
                    key={s.id}
                    href={`/sar/${s.id}`}
                    className="grid grid-cols-12 items-center gap-4 px-6 py-5 transition-colors hover:bg-azure-50/40"
                  >
                    <div className="col-span-4 min-w-0">
                      <div className="truncate text-sm font-medium text-ink">
                        {s.requesterName}
                      </div>
                      <div className="truncate text-xs text-ink-subtle">
                        {s.requesterEmail}
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-ink-muted">
                      {formatUkDate(s.receivedDate)}
                    </div>
                    <div className="col-span-2 text-xs text-ink-muted">
                      {formatUkDate(s.dueDate)}
                    </div>
                    <div className="col-span-2">
                      <span className="tag">{formatStatus(s.status)}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      {isOverdue ? (
                        <span className="text-sm font-medium text-red-600">
                          {overdue}d overdue
                        </span>
                      ) : (
                        <span className="text-sm text-ink-muted">
                          {until}d remaining
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    identified: "Identified",
    acknowledged: "Acknowledged",
    data_requested: "Data requested",
    data_collected: "Data collected",
    draft_ready: "Draft ready",
    approved: "Approved",
    sent: "Sent",
    completed: "Completed",
  };
  return map[status] ?? status;
}
