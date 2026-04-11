import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ sar });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();

  const existing = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: any = {};
  const allowed = [
    "status",
    "currentStep",
    "aiDraftResponse",
    "aiDraftSubject",
    "templateUsed",
    "department",
    "complexity",
    "isVexatious",
    "exemptionReason",
    "notes",
    "extensionApplied",
    "extendedDueDate",
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (body.extendedDueDate) {
    data.extendedDueDate = new Date(body.extendedDueDate);
  }

  const activityAction = body._activity?.action;
  const activityDetail = body._activity?.detail;

  const sar = await prisma.sar.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(activityAction
        ? {
            activities: {
              create: {
                action: activityAction,
                detail: activityDetail ?? null,
              },
            },
          }
        : {}),
    },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json({ sar });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const existing = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.sar.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
