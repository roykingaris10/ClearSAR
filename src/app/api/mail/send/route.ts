import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { sendOrDraftEmail } from "@/lib/graph";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/mail/send
 * Body: { sarId: string, to: string, subject: string, body: string }
 *
 * Sends (or drafts) the approved email via Graph API and logs the activity.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { sarId, to, subject, body } = await req.json();
  if (!sarId || !to || !subject || !body) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const sar = await prisma.sar.findFirst({
    where: { id: sarId, userId: auth.user.id },
  });
  if (!sar) {
    return NextResponse.json({ error: "sar_not_found" }, { status: 404 });
  }

  let result;
  try {
    result = await sendOrDraftEmail(auth.user.id, { to, subject, body });
  } catch (err: any) {
    return NextResponse.json(
      { error: "send_failed", detail: err.message },
      { status: 500 }
    );
  }

  const now = new Date();
  await prisma.sar.update({
    where: { id: sarId },
    data: {
      status: result.mode === "sent" ? "sent" : "draft_ready",
      responseSentAt: result.mode === "sent" ? now : null,
      completedAt: result.mode === "sent" ? now : null,
      currentStep: result.mode === "sent" ? 7 : 5,
      activities: {
        create: {
          action:
            result.mode === "sent"
              ? "email_sent"
              : "draft_created_in_outlook",
          detail:
            result.mode === "sent"
              ? `Response sent to ${to}`
              : `Draft created in Outlook Drafts folder for ${to}`,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, mode: result.mode });
}
