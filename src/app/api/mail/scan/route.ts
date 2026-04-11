import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-auth";
import { fetchInboxMessages } from "@/lib/graph";
import { classifyEmail, SarClassification } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/mail/scan
 * Body: { since?: ISO date, top?: number, mailbox?: string }
 *
 * Fetches inbox messages and classifies each one with Claude.
 * Returns a list of scanned messages with SAR verdicts so the DPO can
 * triage which to add to the queue.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const since = body.since ? new Date(body.since) : undefined;
  const top = Math.min(Number(body.top ?? 25), 100);
  const mailbox = body.mailbox || undefined;

  let messages;
  try {
    messages = await fetchInboxMessages(auth.user.id, { since, top, mailbox });
  } catch (err: any) {
    return NextResponse.json(
      { error: "graph_fetch_failed", detail: err.message },
      { status: 500 }
    );
  }

  // Classify in parallel but cap concurrency to avoid rate limits
  const results: Array<{
    message: (typeof messages)[number];
    classification: SarClassification;
  }> = [];

  const CONCURRENCY = 4;
  for (let i = 0; i < messages.length; i += CONCURRENCY) {
    const batch = messages.slice(i, i + CONCURRENCY);
    const classified = await Promise.all(
      batch.map(async (m) => {
        try {
          const classification = await classifyEmail({
            subject: m.subject,
            from: `${m.fromName} <${m.fromEmail}>`,
            body: stripHtml(m.body) || m.bodyPreview,
          });
          return { message: m, classification };
        } catch (err: any) {
          return {
            message: m,
            classification: {
              is_sar: false,
              confidence: 0,
              requester_name: null,
              requester_email: null,
              sar_type: null,
              reasoning: `Classification failed: ${err.message}`,
            } satisfies SarClassification,
          };
        }
      })
    );
    results.push(...classified);
  }

  return NextResponse.json({
    scanned: messages.length,
    detected: results.filter((r) => r.classification.is_sar).length,
    results,
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
