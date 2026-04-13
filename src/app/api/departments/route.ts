import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/departments
 * List all departments for the authenticated user.
 */
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const departments = await prisma.department.findMany({
    where: { userId: auth.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { dataRequests: true } },
    },
  });

  return NextResponse.json({ departments });
}

/**
 * POST /api/departments
 * Create a new department.
 * Body: { name, contactEmail, contactName?, dataTypes?: string[] }
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { name, contactEmail, contactName, dataTypes } = body;

  if (!name || !contactEmail) {
    return NextResponse.json(
      { error: "missing_fields", detail: "name and contactEmail are required" },
      { status: 400 }
    );
  }

  // Check for duplicate department name
  const existing = await prisma.department.findFirst({
    where: { userId: auth.user.id, name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "duplicate", detail: `Department "${name}" already exists` },
      { status: 409 }
    );
  }

  const department = await prisma.department.create({
    data: {
      userId: auth.user.id,
      name,
      contactEmail,
      contactName: contactName ?? null,
      dataTypes: JSON.stringify(dataTypes ?? []),
    },
  });

  return NextResponse.json({ department }, { status: 201 });
}

/**
 * PATCH /api/departments
 * Update a department.
 * Body: { id, name?, contactEmail?, contactName?, dataTypes?: string[] }
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const existing = await prisma.department.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail;
  if (body.contactName !== undefined) data.contactName = body.contactName;
  if (body.dataTypes !== undefined) data.dataTypes = JSON.stringify(body.dataTypes);

  const department = await prisma.department.update({
    where: { id },
    data,
  });

  return NextResponse.json({ department });
}

/**
 * DELETE /api/departments
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const existing = await prisma.department.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
