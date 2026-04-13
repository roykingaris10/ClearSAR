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
import { AdvisoryPanel } from "@/components/AdvisoryPanel";
import { ExemptionPicker } from "@/components/ExemptionPicker";
import { DataRequestTracker } from "@/components/DataRequestTracker";

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

  const [sar, exemptions, dataRequests, departments] = await Promise.all([
    prisma.sar.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        activities: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.sarExemption.findMany({
      where: { sarId: params.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dataRequest.findMany({
      where: { sarId: params.id },
      include: { department: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, contactEmail: true },
    }),
  ]);

  if (!sar) notFound();

  const overdue = daysOverdue(sar.dueDate);
  const until = daysUntilDue(sar.dueDate);
  const reference = sarReference(sar.id, sar.receivedDate);

  // Parse cached advisory if available
  const advisory = sar.aiAdvisory ? JSON.parse(sar.aiAdvisory) : null;

  return (
    <AppShell userEmail={user.email} userName={user.name ?? undefined}>
      <div className="stagger space-y-8">
        <Link
          href="/queue"
          className="text-xs text-ink-subtle hover:text-azure-600"
        >
          &larr; Back to queue
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="stat-label">{reference}</div>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink">
              {sar.requesterName}
            </h1>
            <div className="mt-2 text-sm text-ink-muted">
              {sar.requesterEmail}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tag">
                Received {formatUkDate(sar.receivedDate)}
              </span>
              <span className="tag">Due {formatUkDate(sar.dueDate)}</span>
              {sar.sarType && <span className="tag-azure">{sar.sarType}</span>}
              {sar.complexity && (
                <span className="tag-azure">{sar.complexity}</span>
              )}
              {sar.aiClassificationScore != null && (
                <span className="tag-azure">
                  AI {Math.round(sar.aiClassificationScore * 100)}%
                </span>
              )}
              {sar.priorityScore != null && (
                <span className="tag-azure">
                  Priority {sar.priorityScore}/100
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {overdue > 0 ? (
              <>
                <div className="text-6xl font-semibold tracking-tight text-red-600">
                  {overdue}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-ink-subtle">
                  days overdue
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl font-semibold tracking-tight text-azure-500">
                  {until}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-ink-subtle">
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
                        ? "border-azure-500 bg-azure-500 text-white"
                        : active
                          ? "border-azure-400 text-azure-600"
                          : "border-ink/15 text-ink-subtle"
                    }`}
                  >
                    {done ? "✓" : idx + 1}
                  </div>
                  <div
                    className={`text-center text-[10px] ${
                      done || active ? "text-ink" : "text-ink-subtle"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Two-column layout: main actions + advisory sidebar */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Workflow actions + draft editor */}
            <SarWorkflow
              sarId={sar.id}
              initialDraftSubject={sar.aiDraftSubject ?? ""}
              initialDraftBody={sar.aiDraftResponse ?? ""}
              requesterEmail={sar.requesterEmail}
              currentStatus={sar.status}
            />

            {/* Data collection tracker */}
            <DataRequestTracker
              sarId={sar.id}
              initial={dataRequests as any}
              departments={departments}
            />

            {/* Exemptions */}
            <ExemptionPicker sarId={sar.id} initial={exemptions} />

            {/* Original email */}
            <section className="card">
              <div className="stat-label">Original message</div>
              <div className="mt-4 text-sm font-medium text-ink">{sar.subject}</div>
              <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-ink-muted">
                {sar.emailBody.slice(0, 5000)}
              </pre>
            </section>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-8">
            {/* AI Advisory */}
            <AdvisoryPanel sarId={sar.id} initial={advisory} />

            {/* Activity log */}
            <section className="card">
              <div className="stat-label">Activity</div>
              <ul className="mt-6 space-y-4">
                {sar.activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-4">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-azure-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink">
                        {a.detail ?? a.action}
                      </div>
                      <div className="text-[11px] text-ink-subtle">
                        {formatUkDate(a.createdAt)} &middot;{" "}
                        {new Date(a.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </li>
                ))}
                {sar.activities.length === 0 && (
                  <li className="text-xs text-ink-subtle">No activity yet.</li>
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
