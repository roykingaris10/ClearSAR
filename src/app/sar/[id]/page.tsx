import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/require-session";
import { prisma } from "@/lib/db";
import {
  daysOverdue,
  daysUntilDue,
  formatUkDate,
  sarReference,
} from "@/lib/deadlines";
import { AppShell } from "@/components/AppShell";
import { SarWorkflow } from "@/components/SarWorkflow";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

const STEPS = [
  "Identified",
  "Acknowledged",
  "Data requested",
  "Data collected",
  "Draft ready",
  "Approved",
  "Sent",
  "Completed",
];

export default async function SarDetailPage({ params }: PageProps) {
  const user = await requireSessionUser();

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!sar) notFound();

  const overdue = daysOverdue(sar.dueDate);
  const until = daysUntilDue(sar.dueDate);
  const reference = sarReference(sar.id, sar.receivedDate);

  return (
    <AppShell userEmail={user.email} userName={user.name ?? undefined}>
      <div className="stagger space-y-8">
        <Link
          href="/queue"
          className="text-xs text-white/40 hover:text-white/70"
        >
          ← Back to queue
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="stat-label">{reference}</div>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">
              {sar.requesterName}
            </h1>
            <div className="mt-2 text-sm text-white/50">
              {sar.requesterEmail}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tag">
                Received {formatUkDate(sar.receivedDate)}
              </span>
              <span className="tag">Due {formatUkDate(sar.dueDate)}</span>
              {sar.sarType && <span className="tag">{sar.sarType}</span>}
              {sar.aiClassificationScore != null && (
                <span className="tag">
                  AI {Math.round(sar.aiClassificationScore * 100)}%
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {overdue > 0 ? (
              <>
                <div className="text-6xl font-semibold tracking-tight">
                  {overdue}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-white/50">
                  days overdue
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl font-semibold tracking-tight">
                  {until}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-white/50">
                  days remaining
                </div>
              </>
            )}
          </div>
        </header>

        {/* Workflow stepper */}
        <section className="card">
          <div className="stat-label">Workflow</div>
          <div className="mt-6 flex items-center justify-between gap-2">
            {STEPS.map((label, idx) => {
              const done = idx < sar.currentStep;
              const active = idx === sar.currentStep;
              return (
                <div
                  key={label}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold ${
                      done
                        ? "border-white bg-white text-black"
                        : active
                          ? "border-white text-white"
                          : "border-white/20 text-white/30"
                    }`}
                  >
                    {done ? "✓" : idx + 1}
                  </div>
                  <div
                    className={`text-center text-[10px] ${
                      done || active ? "text-white/80" : "text-white/30"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Workflow actions + draft editor */}
        <SarWorkflow
          sarId={sar.id}
          initialDraftSubject={sar.aiDraftSubject ?? ""}
          initialDraftBody={sar.aiDraftResponse ?? ""}
          requesterEmail={sar.requesterEmail}
          currentStatus={sar.status}
        />

        {/* Original email */}
        <section className="card">
          <div className="stat-label">Original message</div>
          <div className="mt-4 text-sm font-medium">{sar.subject}</div>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-white/60">
            {sar.emailBody.slice(0, 5000)}
          </pre>
        </section>

        {/* Activity log */}
        <section className="card">
          <div className="stat-label">Activity</div>
          <ul className="mt-6 space-y-4">
            {sar.activities.map((a) => (
              <li key={a.id} className="flex items-start gap-4">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{a.detail ?? a.action}</div>
                  <div className="text-[11px] text-white/40">
                    {formatUkDate(a.createdAt)} ·{" "}
                    {new Date(a.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </li>
            ))}
            {sar.activities.length === 0 && (
              <li className="text-xs text-white/40">No activity yet.</li>
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
