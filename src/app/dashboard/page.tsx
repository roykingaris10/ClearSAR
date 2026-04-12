import Link from "next/link";
import { requireSessionUser } from "@/lib/require-session";
import { prisma } from "@/lib/db";
import { daysOverdue, formatUkDate } from "@/lib/deadlines";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireSessionUser();

  const sars = await prisma.sar.findMany({
    where: { userId: user.id },
    orderBy: { dueDate: "asc" },
  });

  const open = sars.filter(
    (s) => s.status !== "sent" && s.status !== "completed"
  );
  const overdueSars = open
    .map((s) => ({ ...s, _overdue: daysOverdue(s.dueDate) }))
    .filter((s) => s._overdue > 0)
    .sort((a, b) => b._overdue - a._overdue);

  const mostOverdue = overdueSars[0];
  const completedThisWeek = sars.filter((s) => {
    if (!s.completedAt) return false;
    return (
      Date.now() - new Date(s.completedAt).getTime() < 1000 * 60 * 60 * 24 * 7
    );
  }).length;

  const avgOverdueDays =
    overdueSars.length > 0
      ? Math.round(
          overdueSars.reduce((sum, s) => sum + s._overdue, 0) /
            overdueSars.length
        )
      : 0;

  const buckets = { "1-29": 0, "30-59": 0, "60-89": 0, "90+": 0 };
  for (const s of overdueSars) {
    if (s._overdue >= 90) buckets["90+"]++;
    else if (s._overdue >= 60) buckets["60-89"]++;
    else if (s._overdue >= 30) buckets["30-59"]++;
    else buckets["1-29"]++;
  }
  const maxBucket = Math.max(...Object.values(buckets), 1);

  const icoRisk = calculateIcoRisk(overdueSars.length, buckets["90+"]);

  const projections = [1, 2, 3, 5].map((rate) => {
    const days = Math.ceil(overdueSars.length / rate);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return { rate, days, date };
  });

  return (
    <AppShell userEmail={user.email} userName={user.name ?? undefined}>
      <div className="stagger space-y-12">
        {/* Hero stat */}
        <section>
          <div className="stat-label">Total SARs overdue</div>
          <div className="mt-3 flex items-end gap-6">
            <div className="text-[120px] font-semibold leading-none tracking-tight text-ink">
              {overdueSars.length}
            </div>
            <div className="pb-4">
              <div className="text-sm text-ink-muted">
                of {open.length} open requests
              </div>
              <div className="mt-1 text-xs text-ink-subtle">
                Average {avgOverdueDays} days past deadline
              </div>
            </div>
          </div>
        </section>

        {/* ICO risk */}
        <section className={`card ${riskBorder(icoRisk.level)}`}>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="stat-label">ICO risk assessment</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                {icoRisk.level} — {icoRisk.label}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {icoRisk.description}
              </p>
            </div>
            <div className="text-right">
              <div className="stat-label">Severely overdue</div>
              <div className="mt-2 text-4xl font-semibold text-ink">
                {buckets["90+"]}
              </div>
              <div className="text-xs text-ink-subtle">90+ days</div>
            </div>
          </div>
        </section>

        {/* Metrics grid */}
        <section className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/[0.06] bg-ink/[0.06] shadow-card sm:grid-cols-4">
          <Metric label="Open" value={open.length} />
          <Metric
            label="Drafts ready"
            value={sars.filter((s) => s.status === "draft_ready").length}
          />
          <Metric label="Sent this week" value={completedThisWeek} />
          <Metric
            label="Most overdue"
            value={mostOverdue ? `${mostOverdue._overdue}d` : "—"}
            sub={mostOverdue?.requesterName}
            href={mostOverdue ? `/sar/${mostOverdue.id}` : undefined}
          />
        </section>

        {/* Distribution */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="card">
            <div className="stat-label">Overdue distribution</div>
            <div className="mt-8 space-y-5">
              {(["90+", "60-89", "30-59", "1-29"] as const).map((band) => (
                <div key={band}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-ink-muted">{band} days</span>
                    <span className="font-medium text-ink">
                      {buckets[band]}
                    </span>
                  </div>
                  <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-ink/[0.06]">
                    <div
                      className="h-full rounded-full bg-azure-500 transition-all duration-700"
                      style={{
                        width: `${(buckets[band] / maxBucket) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="stat-label">Clearance projection</div>
            <p className="mt-3 text-sm text-ink-muted">
              Time to clear the current backlog at a steady rate.
            </p>
            <div className="mt-6 space-y-3">
              {projections.map((p) => (
                <div
                  key={p.rate}
                  className="flex items-center justify-between rounded-xl border border-ink/[0.06] bg-white/60 px-4 py-3 backdrop-blur"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {p.rate} {p.rate === 1 ? "SAR" : "SARs"} / day
                    </div>
                    <div className="text-[11px] text-ink-subtle">
                      {p.days} working days
                    </div>
                  </div>
                  <div className="text-sm text-ink-muted">
                    Clear by {formatUkDate(p.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Most critical */}
        {mostOverdue && (
          <section>
            <div className="stat-label">Most critical SAR</div>
            <Link
              href={`/sar/${mostOverdue.id}`}
              className="group mt-3 block rounded-2xl border border-ink/[0.06] bg-white/70 p-6 shadow-card backdrop-blur-xl transition-all hover:border-azure-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-azure-500 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-azure-500" />
                    </span>
                    <span className="text-2xl font-semibold tracking-tight text-ink">
                      {mostOverdue.requesterName}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-ink-muted">
                    {mostOverdue.requesterEmail}
                  </div>
                  <div className="mt-3 text-xs text-ink-subtle">
                    Received {formatUkDate(mostOverdue.receivedDate)} · Due{" "}
                    {formatUkDate(mostOverdue.dueDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-semibold tracking-tight text-ink">
                    {mostOverdue._overdue}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-subtle">
                    days overdue
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {sars.length === 0 && <EmptyState />}
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-white/80 p-8 backdrop-blur">
      <div className="stat-label">{label}</div>
      <div className="mt-4 text-4xl font-semibold tracking-tight text-ink">
        {value}
      </div>
      {sub && (
        <div className="mt-1 truncate text-xs text-ink-subtle">{sub}</div>
      )}
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block transition-colors hover:bg-azure-50/60"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function EmptyState() {
  return (
    <section className="card text-center">
      <div className="stat-label">Nothing to show yet</div>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        Scan your inbox to get started.
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
        ClearSAR reads your Outlook inbox, identifies Subject Access Requests,
        and adds them to your queue.
      </p>
      <Link href="/inbox" className="pill pill-primary mt-6 text-sm">
        Open Inbox Scanner
      </Link>
    </section>
  );
}

function calculateIcoRisk(totalOverdue: number, severelyOverdue: number) {
  if (severelyOverdue >= 10 || totalOverdue >= 100) {
    return {
      level: "Critical",
      label: "Enforcement likely",
      description:
        "Backlog at this scale is reportable. An ICO investigation would likely result in formal enforcement action. Clear the 90+ day cohort as your first priority.",
    };
  }
  if (severelyOverdue >= 3 || totalOverdue >= 30) {
    return {
      level: "High",
      label: "Reprimand likely",
      description:
        "Sustained breach of Article 12(3). The ICO would likely issue a reprimand and require an action plan from the organisation.",
    };
  }
  if (totalOverdue >= 5) {
    return {
      level: "Moderate",
      label: "Action required",
      description:
        "Several requests are past their statutory deadline. Document mitigation steps and increase clearance rate.",
    };
  }
  return {
    level: "Low",
    label: "On track",
    description:
      "Backlog is manageable. Maintain the current clearance rate and you will stay compliant.",
  };
}

function riskBorder(level: string) {
  if (level === "Critical") return "border-red-300/70";
  if (level === "High") return "border-amber-300/70";
  if (level === "Moderate") return "border-azure-300/70";
  return "border-ink/[0.06]";
}
