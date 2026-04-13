import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/sar/[id]/data-requests
 * List all internal data collection requests for this SAR.
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

  const dataRequests = await prisma.dataRequest.findMany({
    where: { sarId: params.id },
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ dataRequests });
}

/**
 * POST /api/sar/[id]/data-requests
 * Create data collection requests for specified departments.
 * Body: { departmentIds: string[], requestNote?: string }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const { departmentIds, requestNote } = body;

  if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
    return NextResponse.json(
      { error: "missing_departments", detail: "departmentIds array is required" },
      { status: 400 }
    );
  }

  // Verify all departments belong to this user
  const departments = await prisma.department.findMany({
    where: { id: { in: departmentIds }, userId: auth.user.id },
  });
  if (departments.length !== departmentIds.length) {
    return NextResponse.json(
      { error: "invalid_departments", detail: "One or more department IDs are invalid" },
      { status: 400 }
    );
  }

  // Create data requests, skipping departments that already have a pending request
  const existing = await prisma.dataRequest.findMany({
    where: { sarId: params.id, departmentId: { in: departmentIds } },
    select: { departmentId: true },
  });
  const existingIds = new Set(existing.map((e) => e.departmentId));

  const newDepts = departments.filter((d) => !existingIds.has(d.id));
  if (newDepts.length === 0) {
    return NextResponse.json(
      { error: "already_requested", detail: "Data already requested from all specified departments" },
      { status: 409 }
    );
  }

  const created = await prisma.$transaction(
    newDepts.map((dept) =>
      prisma.dataRequest.create({
        data: {
          sarId: params.id,
          departmentId: dept.id,
          status: "pending",
          requestNote: requestNote ?? null,
        },
        include: { department: true },
      })
    )
  );

  // Log activity
  const deptNames = newDepts.map((d) => d.name).join(", ");
  await prisma.activity.create({
    data: {
      sarId: params.id,
      action: "data_requested",
      detail: `Data requested from: ${deptNames}`,
    },
  });

  // Advance workflow if still at early step
  if (sar.currentStep < 2) {
    await prisma.sar.update({
      where: { id: sar.id },
      data: { currentStep: 2, status: "data_requested" },
    });
  }

  return NextResponse.json({ dataRequests: created }, { status: 201 });
}

/**
 * PATCH /api/sar/[id]/data-requests
 * Update a data request status (mark received, chase, add notes).
 * Body: { dataRequestId, status?, responseNote?, chase?: boolean }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
    select: { id: true, currentStep: true },
  });
  if (!sar) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const { dataRequestId } = body;
  if (!dataRequestId) {
    return NextResponse.json({ error: "missing_data_request_id" }, { status: 400 });
  }

  const existing = await prisma.dataRequest.findFirst({
    where: { id: dataRequestId, sarId: params.id },
    include: { department: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "data_request_not_found" }, { status: 404 });
  }

  const data: any = {};

  // Chase functionality
  if (body.chase) {
    data.chasedAt = new Date();
    data.chaseCount = existing.chaseCount + 1;
    data.status = "chased";

    await prisma.activity.create({
      data: {
        sarId: params.id,
        action: "department_chased",
        detail: `Chase #${existing.chaseCount + 1} sent to ${existing.department.name}`,
      },
    });
  }

  // Status update
  if (body.status) {
    data.status = body.status;
    if (body.status === "received") {
      data.receivedAt = new Date();

      await prisma.activity.create({
        data: {
          sarId: params.id,
          action: "data_received",
          detail: `Data received from ${existing.department.name}`,
        },
      });

      // Check if all data requests for this SAR are now received
      const pending = await prisma.dataRequest.count({
        where: {
          sarId: params.id,
          id: { not: dataRequestId },
          status: { not: "received" },
        },
      });
      if (pending === 0 && sar.currentStep < 3) {
        await prisma.sar.update({
          where: { id: sar.id },
          data: { currentStep: 3, status: "data_collected", dataCollectedAt: new Date() },
        });
      }
    }

    if (body.status === "sent") {
      data.sentAt = new Date();
    }
  }

  if (body.responseNote !== undefined) {
    data.responseNote = body.responseNote;
  }

  const updated = await prisma.dataRequest.update({
    where: { id: dataRequestId },
    data,
    include: { department: true },
  });

  return NextResponse.json({ dataRequest: updated });
}
