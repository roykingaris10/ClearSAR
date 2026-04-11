import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";
import { generateDraft } from "@/lib/claude";
import { formatUkDate, sarReference } from "@/lib/deadlines";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Params {
  params: { id: string };
}

/**
 * POST /api/sar/[id]/draft
 * Body: { templateType?: "acknowledge" | "extension" | "final" | "exemption" }
 *
 * Generates an AI response draft for this SAR using the requested template.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const templateType: string = body.templateType ?? "acknowledge";

  const sar = await prisma.sar.findFirst({
    where: { id: params.id, userId: auth.user.id },
  });
  if (!sar) {
    return NextResponse.json({ error: "sar_not_found" }, { status: 404 });
  }

  const template = await prisma.template.findFirst({
    where: { userId: auth.user.id, type: templateType },
  });
  if (!template) {
    return NextResponse.json(
      { error: "template_not_found", detail: `No template of type ${templateType}` },
      { status: 404 }
    );
  }

  try {
    const drafted = await generateDraft({
      template: {
        name: template.name,
        subject: template.subject,
        body: template.body,
      },
      requesterName: sar.requesterName,
      requesterEmail: sar.requesterEmail,
      receivedDate: formatUkDate(sar.receivedDate),
      dueDate: formatUkDate(sar.dueDate),
      extendedDueDate: sar.extendedDueDate
        ? formatUkDate(sar.extendedDueDate)
        : undefined,
      sarReference: sarReference(sar.id, sar.receivedDate),
      department: sar.department ?? undefined,
      originalEmailBody: sar.emailBody,
      dpoName: process.env.DPO_NAME ?? auth.user.name ?? "Data Protection Officer",
      dpoEmail: process.env.DPO_EMAIL ?? auth.user.email,
      organisationName: process.env.ORGANISATION_NAME ?? "Your Organisation",
    });

    await prisma.sar.update({
      where: { id: sar.id },
      data: {
        aiDraftResponse: drafted.body,
        aiDraftSubject: drafted.subject,
        templateUsed: template.type,
        status: "draft_ready",
        currentStep: Math.max(sar.currentStep, 4),
        activities: {
          create: {
            action: "ai_draft_generated",
            detail: `Draft generated using template: ${template.name}`,
          },
        },
      },
    });

    return NextResponse.json({ draft: drafted });
  } catch (err: any) {
    return NextResponse.json(
      { error: "draft_failed", detail: err.message },
      { status: 500 }
    );
  }
}
