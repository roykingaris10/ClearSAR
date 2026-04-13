import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";
import { analysesSar } from "@/lib/claude";
import { daysOverdue, daysUntilDue, formatUkDate } from "@/lib/deadlines";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Params {
  params: { id: string };
}

/**
 * GET /api/sar/[id]/advisory
 * Returns cached advisory if available, or null.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
    select: { aiAdvisory: true },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const advisory = sar.aiAdvisory ? JSON.parse(sar.aiAdvisory) : null;
  return NextResponse.json({ advisory });
}

/**
 * POST /api/sar/[id]/advisory
 * Generate (or regenerate) contextual AI advisory for this SAR.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Count prior requests from same requester
  const priorRequestCount = await prisma.sar.count({
    where: {
      userId: auth.user.id,
      requesterEmail: sar.requesterEmail,
      id: { not: sar.id },
    },
  });

  // Get user's configured departments
  const departments = await prisma.department.findMany({
    where: { userId: auth.user.id },
    select: { name: true },
  });

  try {
    const advisory = await analysesSar({
      requesterName: sar.requesterName,
      requesterEmail: sar.requesterEmail,
      subject: sar.subject,
      emailBody: sar.emailBody,
      receivedDate: formatUkDate(sar.receivedDate),
      dueDate: formatUkDate(sar.dueDate),
      daysOverdue: daysOverdue(sar.dueDate),
      daysRemaining: daysUntilDue(sar.dueDate),
      sarType: sar.sarType ?? undefined,
      priorRequestCount,
      organisationDepartments: departments.map((d) => d.name),
    });

    // Persist advisory and priority score
    await prisma.sar.update({
      where: { id: sar.id },
      data: {
        aiAdvisory: JSON.stringify(advisory),
        priorityScore: advisory.priorityScore,
        complexity: advisory.complexity,
        activities: {
          create: {
            action: "ai_advisory_generated",
            detail: `AI advisory: ${advisory.complexity} complexity, priority ${advisory.priorityScore}/100`,
          },
        },
      },
    });

    return NextResponse.json({ advisory });
  } catch (err: any) {
    return NextResponse.json(
      { error: "advisory_failed", detail: err.message },
      { status: 500 }
    );
  }
}
