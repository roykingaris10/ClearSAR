// Default response templates shipped with ClearSAR.
// Users can edit these freely in the Templates settings page.

export interface DefaultTemplate {
  name: string;
  type:
    | "acknowledge"
    | "extension"
    | "department_chaser"
    | "final"
    | "exemption";
  subject: string;
  body: string;
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Acknowledgement",
    type: "acknowledge",
    subject:
      "Acknowledgement of Your Subject Access Request — Ref: {{sar_reference}}",
    body: `Dear {{requester_name}},

Thank you for your request for personal data received on {{received_date}}.

We are processing your request in accordance with Article 15 of the UK GDPR and will respond within the statutory timeframe of one calendar month from receipt, i.e., by {{due_date}}.

If we require any further information to verify your identity or clarify the scope of your request, we will contact you separately.

Your reference number is {{sar_reference}}. Please quote this in any future correspondence.

Yours sincerely,
{{dpo_name}}
Data Protection Officer
{{organisation_name}}`,
  },
  {
    name: "Extension Notification",
    type: "extension",
    subject:
      "Update on Your Subject Access Request — Ref: {{sar_reference}}",
    body: `Dear {{requester_name}},

I am writing to inform you that, due to the complexity of your request (received {{received_date}}), we are exercising our right under Article 12(3) of the UK GDPR to extend the response period by a further two months.

Your extended deadline is now {{extended_due_date}}.

We apologise for any inconvenience and will provide our response as soon as possible.

Yours sincerely,
{{dpo_name}}
Data Protection Officer
{{organisation_name}}`,
  },
  {
    name: "Department Data Request (Internal)",
    type: "department_chaser",
    subject:
      "URGENT — Data Required for Subject Access Request — Ref: {{sar_reference}}",
    body: `Dear colleague,

We have received a Subject Access Request from {{requester_name}} and are required by law to respond by {{due_date}}.

Please provide ALL personal data held by your department relating to this individual. This includes but is not limited to:
- Personnel files, correspondence, and notes
- Any emails, documents, or records mentioning this individual
- System records, logs, or database entries

Please send the data to {{dpo_email}} as soon as possible.

If you believe no data is held, please confirm in writing.

This is a legal obligation under the UK GDPR. Failure to respond in time may result in regulatory action against the organisation.

{{dpo_name}}
Data Protection Officer
{{organisation_name}}`,
  },
  {
    name: "Final Response",
    type: "final",
    subject:
      "Response to Your Subject Access Request — Ref: {{sar_reference}}",
    body: `Dear {{requester_name}},

Thank you for your Subject Access Request received on {{received_date}}.

In accordance with Article 15 of the UK GDPR, I can confirm that {{organisation_name}} does hold personal data relating to you. Please find enclosed the personal data we have identified across our systems.

{{ai_generated_summary_of_data_provided}}

If any information has been redacted, this is to protect the rights and freedoms of third parties, as permitted under Article 15(4) of the UK GDPR.

If you believe any of the information provided is inaccurate, you have the right to request rectification under Article 16. If you are dissatisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at https://ico.org.uk.

Yours sincerely,
{{dpo_name}}
Data Protection Officer
{{organisation_name}}`,
  },
  {
    name: "Exemption / Vexatious Refusal",
    type: "exemption",
    subject: "Response to Your Request — Ref: {{sar_reference}}",
    body: `Dear {{requester_name}},

Thank you for your request received on {{received_date}}.

Having reviewed your request, we have determined that it is manifestly unfounded or excessive under Article 12(5) of the UK GDPR. We are therefore declining to act on this request.

You have the right to challenge this decision by contacting the Information Commissioner's Office (ICO) at https://ico.org.uk.

Yours sincerely,
{{dpo_name}}
Data Protection Officer
{{organisation_name}}`,
  },
];

export async function ensureDefaultTemplates(userId: string) {
  const { prisma } = await import("./db");
  const existing = await prisma.template.count({ where: { userId } });
  if (existing > 0) return;

  await prisma.template.createMany({
    data: DEFAULT_TEMPLATES.map((t) => ({
      userId,
      name: t.name,
      type: t.type,
      subject: t.subject,
      body: t.body,
      isDefault: true,
    })),
  });
}
