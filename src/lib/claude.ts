import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface SarClassification {
  is_sar: boolean;
  confidence: number;
  requester_name: string | null;
  requester_email: string | null;
  sar_type: "full" | "partial" | "deletion" | "rectification" | null;
  reasoning: string;
}

const CLASSIFY_SYSTEM = `You are a UK GDPR expert. Analyse the following email and determine if it is a Subject Access Request (SAR) under Article 15 of the UK GDPR.

A SAR is any request where an individual asks an organisation for:
- A copy of their personal data
- Confirmation of whether their data is being processed
- Details of how their data is used, who it's shared with, retention periods

Important: A SAR does NOT need to use the words "subject access request" or "GDPR" or "Article 15". It can be informal. Examples:
- "Can you send me all the information you hold about me?"
- "I want copies of all my records"
- "What data do you have on me?"
- Even: "Send me my file" (in context of employment)

Respond with ONLY a JSON object matching this schema:
{
  "is_sar": true|false,
  "confidence": 0.0-1.0,
  "requester_name": "extracted name or null",
  "requester_email": "extracted email or null",
  "sar_type": "full" | "partial" | "deletion" | "rectification" | null,
  "reasoning": "one-sentence explanation"
}
Return the JSON object only — no markdown fences, no preamble.`;

export async function classifyEmail(params: {
  subject: string;
  from: string;
  body: string;
}): Promise<SarClassification> {
  const anthropic = getClient();
  const userContent = `Subject: ${params.subject}
From: ${params.from}

Body:
${params.body.slice(0, 4000)}`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: CLASSIFY_SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });

  const text = extractText(res);
  return parseClassification(text);
}

function parseClassification(text: string): SarClassification {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      is_sar: Boolean(parsed.is_sar),
      confidence: Number(parsed.confidence ?? 0),
      requester_name: parsed.requester_name ?? null,
      requester_email: parsed.requester_email ?? null,
      sar_type: parsed.sar_type ?? null,
      reasoning: String(parsed.reasoning ?? ""),
    };
  } catch {
    return {
      is_sar: false,
      confidence: 0,
      requester_name: null,
      requester_email: null,
      sar_type: null,
      reasoning: "Failed to parse AI response",
    };
  }
}

export interface DraftContext {
  template: { subject: string; body: string; name: string };
  requesterName: string;
  requesterEmail: string;
  receivedDate: string;
  dueDate: string;
  extendedDueDate?: string;
  sarReference: string;
  department?: string;
  originalEmailBody: string;
  dpoName: string;
  dpoEmail: string;
  organisationName: string;
}

const DRAFT_SYSTEM = `You are a UK GDPR Data Protection Officer drafting a response to a Subject Access Request. You write in formal UK English, with the precision expected in legally sensitive correspondence.`;

export interface DraftedEmail {
  subject: string;
  body: string;
}

export async function generateDraft(ctx: DraftContext): Promise<DraftedEmail> {
  const anthropic = getClient();

  const prompt = `Use the TEMPLATE below and fill in all {{placeholders}} using the SAR DETAILS. Keep the template's structure and tone.

TEMPLATE NAME: ${ctx.template.name}

TEMPLATE SUBJECT:
${ctx.template.subject}

TEMPLATE BODY:
${ctx.template.body}

SAR DETAILS:
- Requester name: ${ctx.requesterName}
- Requester email: ${ctx.requesterEmail}
- Received date: ${ctx.receivedDate}
- Due date: ${ctx.dueDate}
${ctx.extendedDueDate ? `- Extended due date: ${ctx.extendedDueDate}` : ""}
- SAR reference: ${ctx.sarReference}
- Department: ${ctx.department ?? "n/a"}
- DPO name: ${ctx.dpoName}
- DPO email: ${ctx.dpoEmail}
- Organisation: ${ctx.organisationName}

Original request email (for context, do not quote verbatim):
${ctx.originalEmailBody.slice(0, 2000)}

INSTRUCTIONS:
1. Replace every {{placeholder}} with the correct value from the SAR details.
2. If the template contains {{ai_generated_summary_of_data_provided}}, write a brief professional placeholder note such as "[Summary of data categories being provided — to be inserted by the DPO before sending]".
3. Maintain formal UK English throughout.
4. Do not invent facts about the individual that are not supported by the SAR details.
5. Respond with a JSON object:
{"subject": "final subject line", "body": "final email body"}
Return JSON only — no markdown fences, no preamble.`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: DRAFT_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = extractText(res);
  return parseDraft(text, ctx);
}

function parseDraft(text: string, ctx: DraftContext): DraftedEmail {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      subject: String(parsed.subject ?? ctx.template.subject),
      body: String(parsed.body ?? ctx.template.body),
    };
  } catch {
    // Fall back to naive placeholder substitution on the raw template
    return {
      subject: fillPlaceholders(ctx.template.subject, ctx),
      body: fillPlaceholders(ctx.template.body, ctx),
    };
  }
}

function fillPlaceholders(tpl: string, ctx: DraftContext): string {
  return tpl
    .replaceAll("{{requester_name}}", ctx.requesterName)
    .replaceAll("{{requester_email}}", ctx.requesterEmail)
    .replaceAll("{{received_date}}", ctx.receivedDate)
    .replaceAll("{{due_date}}", ctx.dueDate)
    .replaceAll("{{extended_due_date}}", ctx.extendedDueDate ?? ctx.dueDate)
    .replaceAll("{{sar_reference}}", ctx.sarReference)
    .replaceAll("{{department}}", ctx.department ?? "")
    .replaceAll("{{dpo_name}}", ctx.dpoName)
    .replaceAll("{{dpo_email}}", ctx.dpoEmail)
    .replaceAll("{{organisation_name}}", ctx.organisationName);
}

function extractText(res: Anthropic.Messages.Message): string {
  const first = res.content[0];
  if (first && first.type === "text") return first.text;
  return "";
}
