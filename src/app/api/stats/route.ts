import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";
import { daysOverdue } from "@/lib/deadlines";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sars = await prisma.sar.findMany({
    where: { userId: auth.user.id },
    select: {
      id: true,
      requesterName: true,
      dueDate: true,
      status: true,
      completedAt: true,
    },
  });

  const open = sars.filter((s) => s.status !== "sent" && s.status !== "completed");
  const overdue = open.filter((s) => daysOverdue(s.dueDate) > 0);
  const completedThisWeek = sars.filter((s) => {
    if (!s.completedAt) return false;
    const week = 1000 * 60 * 60 * 24 * 7;
    return Date.now() - new Date(s.completedAt).getTime() < week;
  }).length;

  // Overdue distribution buckets
  const buckets = { "1-29": 0, "30-59": 0, "60-89": 0, "90+": 0 };
  let mostOverdue: { id: string; name: string; days: number } | null = null;
  let totalOverdueDays = 0;
  for (const s of overdue) {
    const days = daysOverdue(s.dueDate);
    totalOverdueDays += days;
    if (days >= 90) buckets["90+"]++;
    else if (days >= 60) buckets["60-89"]++;
    else if (days >= 30) buckets["30-59"]++;
    else buckets["1-29"]++;
    if (!mostOverdue || days > mostOverdue.days) {
      mostOverdue = { id: s.id, name: s.requesterName, days };
    }
  }

  const avgOverdueDays =
    overdue.length > 0 ? Math.round(totalOverdueDays / overdue.length) : 0;

  // ICO risk score: simple heuristic based on worst-case overdue count
  const icoRisk = calculateIcoRisk(overdue.length, buckets["90+"]);

  return NextResponse.json({
    totalSars: sars.length,
    openSars: open.length,
    overdueSars: overdue.length,
    completedThisWeek,
    avgOverdueDays,
    mostOverdue,
    buckets,
    icoRisk,
  });
}

function calculateIcoRisk(totalOverdue: number, severelyOverdue: number) {
  if (severelyOverdue >= 10 || totalOverdue >= 100) {
    return {
      level: "Critical",
      label: "Enforcement likely",
      description:
        "Backlog at this scale is reportable. An ICO investigation would likely result in formal enforcement action.",
    };
  }
  if (severelyOverdue >= 3 || totalOverdue >= 30) {
    return {
      level: "High",
      label: "Reprimand likely",
      description:
        "Sustained breach of Article 12(3). The ICO would likely issue a reprimand and require an action plan.",
    };
  }
  if (totalOverdue >= 5) {
    return {
      level: "Moderate",
      label: "Action required",
      description:
        "Several requests past their statutory deadline. Document mitigation steps.",
    };
  }
  return {
    level: "Low",
    label: "On track",
    description: "Backlog is manageable. Maintain current clearance rate.",
  };
}
