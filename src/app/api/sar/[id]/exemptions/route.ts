import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";
import { getExemption } from "@/lib/exemptions";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/sar/[id]/exemptions
 * List all exemptions applied to this SAR.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
    select: { id: true },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const exemptions = await prisma.sarExemption.findMany({
    where: { sarId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ exemptions });
}

/**
 * POST /api/sar/[id]/exemptions
 * Add an exemption to this SAR.
 * Body: { exemptionCode, reasoning, aiSuggested? }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
    select: { id: true },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const { exemptionCode, reasoning, aiSuggested } = body;

  if (!exemptionCode || !reasoning) {
    return NextResponse.json(
      { error: "missing_fields", detail: "exemptionCode and reasoning are required" },
      { status: 400 }
    );
  }

  // Look up from knowledge base for legislation + description
  const known = getExemption(exemptionCode);

  const exemption = await prisma.sarExemption.create({
    data: {
      sarId: params.id,
      exemptionCode,
      legislation: known?.legislation ?? "UK GDPR / DPA 2018",
      description: known?.title ?? exemptionCode,
      reasoning,
      aiSuggested: Boolean(aiSuggested),
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      sarId: params.id,
      action: "exemption_applied",
      detail: `${known?.title ?? exemptionCode}: ${reasoning.slice(0, 120)}`,
    },
  });

  return NextResponse.json({ exemption }, { status: 201 });
}

/**
 * DELETE /api/sar/[id]/exemptions
 * Remove an exemption from this SAR.
 * Body: { exemptionId }
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
    select: { id: true },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const { exemptionId } = body;
  if (!exemptionId) {
    return NextResponse.json({ error: "missing_exemption_id" }, { status: 400 });
  }

  const existing = await prisma.sarExemption.findFirst({
    where: { id: exemptionId, sarId: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "exemption_not_found" }, { status: 404 });
  }

  await prisma.sarExemption.delete({ where: { id: exemptionId } });

  await prisma.activity.create({
    data: {
      sarId: params.id,
      action: "exemption_removed",
      detail: `Removed: ${existing.description}`,
    },
  });

  return NextResponse.json({ ok: true });
}
