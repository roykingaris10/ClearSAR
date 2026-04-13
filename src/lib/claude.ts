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

// ─── Phase 2: Contextual SAR Advisory ─────────────────────────

export interface SarAdvisory {
  validity: {
    is_valid: boolean;
    issues: string[];
    guidance: string;
  };
  suggestedExemptions: Array<{
    code: string;
    reason: string;
    confidence: number;
  }>;
  vexatious: {
    likely: boolean;
    reasoning: string;
    prior_request_count?: number;
  };
  extension: {
    recommended: boolean;
    reasoning: string;
  };
  fee: {
    chargeable: boolean;
    reasoning: string;
  };
  complexity: "simple" | "moderate" | "complex";
  suggestedDepartments: string[];
  priorityScore: number; // 1-100
  summary: string;
}

const ADVISORY_SYSTEM = `You are a UK GDPR Subject Access Request expert adviser. You analyse SAR emails and provide specific, actionable guidance to a Data Protection Officer.

You must return a JSON object with the following structure:
{
  "validity": {
    "is_valid": true/false,
    "issues": ["list of issues if any — e.g. no ID verification, ambiguous scope"],
    "guidance": "specific advice on what to do"
  },
  "suggestedExemptions": [
    {
      "code": "exemption_code",
      "reason": "why this exemption likely applies based on the email content",
      "confidence": 0.0-1.0
    }
  ],
  "vexatious": {
    "likely": true/false,
    "reasoning": "assessment of whether the request appears manifestly unfounded or excessive"
  },
  "extension": {
    "recommended": true/false,
    "reasoning": "whether an Article 12(3) extension is warranted and why"
  },
  "fee": {
    "chargeable": true/false,
    "reasoning": "whether a fee can be charged"
  },
  "complexity": "simple" | "moderate" | "complex",
  "suggestedDepartments": ["list of internal departments likely holding relevant data"],
  "priorityScore": 1-100,
  "summary": "2-3 sentence summary of key actions for the DPO"
}

Valid exemption codes: third_party_data, legal_privilege, crime_prevention, management_forecasting, negotiations, confidential_reference, regulatory_functions, health_serious_harm, manifestly_excessive, available_elsewhere

For suggestedDepartments, infer from context. E.g. employment-related → HR, IT; customer complaint → Customer Service, CRM; financial records → Finance, Payroll.

priorityScore: weight by days overdue (highest factor), requester type (solicitors/legal = higher), complexity, and ICO complaint risk.

Return JSON only — no markdown fences, no preamble.`;

export async function analysesSar(params: {
  requesterName: string;
  requesterEmail: string;
  subject: string;
  emailBody: string;
  receivedDate: string;
  dueDate: string;
  daysOverdue: number;
  daysRemaining: number;
  sarType?: string;
  priorRequestCount: number;
  organisationDepartments: string[];
}): Promise<SarAdvisory> {
  const anthropic = getClient();

  const prompt = `Analyse this Subject Access Request and provide advisory guidance.

SAR DETAILS:
- Requester: ${params.requesterName} (${params.requesterEmail})
- Subject: ${params.subject}
- Received: ${params.receivedDate}
- Statutory deadline: ${params.dueDate}
- Days overdue: ${params.daysOverdue > 0 ? params.daysOverdue : "Not overdue"}
- Days remaining: ${params.daysRemaining > 0 ? params.daysRemaining : "Past deadline"}
- SAR type: ${params.sarType ?? "Not classified"}
- Prior requests from this requester: ${params.priorRequestCount}
- Organisation departments: ${params.organisationDepartments.join(", ") || "Not configured"}

ORIGINAL EMAIL:
${params.emailBody.slice(0, 4000)}

Analyse the above and provide your advisory.`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: ADVISORY_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = extractText(res);
  return parseAdvisory(text);
}

function parseAdvisory(text: string): SarAdvisory {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const p = JSON.parse(cleaned);
    return {
      validity: {
        is_valid: Boolean(p.validity?.is_valid ?? true),
        issues: Array.isArray(p.validity?.issues) ? p.validity.issues : [],
        guidance: String(p.validity?.guidance ?? ""),
      },
      suggestedExemptions: Array.isArray(p.suggestedExemptions)
        ? p.suggestedExemptions.map((e: any) => ({
            code: String(e.code ?? ""),
            reason: String(e.reason ?? ""),
            confidence: Number(e.confidence ?? 0),
          }))
        : [],
      vexatious: {
        likely: Boolean(p.vexatious?.likely ?? false),
        reasoning: String(p.vexatious?.reasoning ?? ""),
      },
      extension: {
        recommended: Boolean(p.extension?.recommended ?? false),
        reasoning: String(p.extension?.reasoning ?? ""),
      },
      fee: {
        chargeable: Boolean(p.fee?.chargeable ?? false),
        reasoning: String(p.fee?.reasoning ?? ""),
      },
      complexity: ["simple", "moderate", "complex"].includes(p.complexity)
        ? p.complexity
        : "moderate",
      suggestedDepartments: Array.isArray(p.suggestedDepartments)
        ? p.suggestedDepartments
        : [],
      priorityScore: Math.min(100, Math.max(1, Number(p.priorityScore ?? 50))),
      summary: String(p.summary ?? ""),
    };
  } catch {
    return {
      validity: { is_valid: true, issues: [], guidance: "Unable to analyse — review manually." },
      suggestedExemptions: [],
      vexatious: { likely: false, reasoning: "" },
      extension: { recommended: false, reasoning: "" },
      fee: { chargeable: false, reasoning: "" },
      complexity: "moderate",
      suggestedDepartments: [],
      priorityScore: 50,
      summary: "Advisory generation failed. Please review this SAR manually.",
    };
  }
}
