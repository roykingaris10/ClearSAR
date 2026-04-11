import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";
import { calculateDueDate } from "@/lib/deadlines";

export const dynamic = "force-dynamic";

/**
 * GET /api/sar — list SARs for current user
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const sars = await prisma.sar.findMany({
    where: {
      userId: auth.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { dueDate: "asc" },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return NextResponse.json({ sars });
}

/**
 * POST /api/sar — create a new SAR from a scanned email
 * Body: {
 *   outlookMessageId, subject, requesterName, requesterEmail,
 *   receivedDate, emailBody, aiClassificationScore?, sarType?
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const required = [
    "outlookMessageId",
    "subject",
    "requesterName",
    "requesterEmail",
    "receivedDate",
    "emailBody",
  ];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json(
        { error: `missing_${key}` },
        { status: 400 }
      );
    }
  }

  // If already added, just return it
  const existing = await prisma.sar.findUnique({
    where: { outlookMessageId: body.outlookMessageId },
  });
  if (existing) {
    return NextResponse.json({ sar: existing, alreadyExists: true });
  }

  const receivedDate = new Date(body.receivedDate);
  const dueDate = calculateDueDate(receivedDate);

  const sar = await prisma.sar.create({
    data: {
      userId: auth.user.id,
      outlookMessageId: body.outlookMessageId,
      subject: body.subject,
      requesterName: body.requesterName,
      requesterEmail: body.requesterEmail,
      receivedDate,
      emailBody: body.emailBody,
      dueDate,
      aiClassificationScore: body.aiClassificationScore ?? null,
      sarType: body.sarType ?? null,
      status: "identified",
      currentStep: 0,
      activities: {
        create: {
          action: "sar_added_to_queue",
          detail: body.aiClassificationScore
            ? `AI classified as SAR (${Math.round(body.aiClassificationScore * 100)}%)`
            : "Added to queue",
        },
      },
    },
  });

  return NextResponse.json({ sar });
}
