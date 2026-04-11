import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const templates = await prisma.template.findMany({
    where: { userId: auth.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ templates });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id, subject, body, name } = await req.json();
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const existing = await prisma.template.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const template = await prisma.template.update({
    where: { id },
    data: {
      ...(subject !== undefined ? { subject } : {}),
      ...(body !== undefined ? { body } : {}),
      ...(name !== undefined ? { name } : {}),
    },
  });
  return NextResponse.json({ template });
}
