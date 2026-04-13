/**
 * UK GDPR / DPA 2018 Exemption Knowledge Base
 *
 * Every exemption a DPO might apply to a Subject Access Request, with:
 * - The statutory citation
 * - A plain-English explanation of the legal test
 * - Pre-drafted language the DPO can drop into a response
 * - Keywords that help AI detect when this exemption might apply
 */

export interface Exemption {
  code: string;
  title: string;
  legislation: string;
  category: "absolute" | "qualified";
  summary: string;
  legalTest: string;
  draftParagraph: string;
  keywords: string[];
}

export const EXEMPTIONS: Exemption[] = [
  // ─── Third party data ─────────────────────────────────────
  {
    code: "third_party_data",
    title: "Third party personal data",
    legislation: "Section 15(5), DPA 2018",
    category: "qualified",
    summary:
      "You do not have to disclose information that identifies another individual unless that person has consented or it is reasonable to disclose without consent.",
    legalTest:
      "Consider: has the third party consented? Would it be reasonable to disclose without consent? Can the information be redacted to remove the third party's identity?",
    draftParagraph:
      "Some of the information falling within the scope of your request contains the personal data of other individuals. Under Section 15(5) of the Data Protection Act 2018, we are not obliged to disclose information that would identify a third party unless that individual has consented or it is reasonable in all the circumstances to comply without consent. We have redacted this information accordingly.",
    keywords: [
      "third party",
      "another person",
      "colleague",
      "other individual",
      "names of others",
      "witness",
      "complainant",
    ],
  },

  // ─── Legal professional privilege ──────────────────────────
  {
    code: "legal_privilege",
    title: "Legal professional privilege",
    legislation: "Schedule 2, Paragraph 19, DPA 2018",
    category: "absolute",
    summary:
      "Information subject to legal professional privilege (advice or litigation privilege) is exempt from disclosure.",
    legalTest:
      "Is the information a confidential communication between a lawyer and client for the purpose of giving or receiving legal advice, or was it created for the dominant purpose of actual or contemplated litigation?",
    draftParagraph:
      "Certain information within the scope of your request is subject to legal professional privilege. Under Schedule 2, Paragraph 19 of the Data Protection Act 2018, we are not required to disclose personal data to the extent that doing so would involve disclosing information in respect of which a claim to legal professional privilege could be maintained in legal proceedings. This information has been withheld.",
    keywords: [
      "solicitor",
      "lawyer",
      "legal advice",
      "litigation",
      "counsel",
      "legal proceedings",
      "privileged",
      "without prejudice",
      "legal hold",
    ],
  },

  // ─── Crime prevention and detection ────────────────────────
  {
    code: "crime_prevention",
    title: "Prevention or detection of crime",
    legislation: "Schedule 2, Paragraph 2, DPA 2018",
    category: "qualified",
    summary:
      "Personal data processed for the prevention or detection of crime, or the apprehension or prosecution of offenders, is exempt to the extent that complying would prejudice those purposes.",
    legalTest:
      "Would disclosing the information be likely to prejudice the prevention or detection of crime, or the apprehension or prosecution of offenders? The prejudice must be real and significant, not speculative.",
    draftParagraph:
      "Some information has been withheld under Schedule 2, Paragraph 2 of the Data Protection Act 2018. Disclosure of this information would be likely to prejudice the prevention or detection of crime, or the apprehension or prosecution of offenders. We have applied this exemption only to the specific information where disclosure would cause such prejudice.",
    keywords: [
      "police",
      "criminal",
      "investigation",
      "fraud",
      "theft",
      "misconduct",
      "disciplinary",
      "gross misconduct",
      "allegation",
      "whistleblow",
    ],
  },

  // ─── Management forecasting ────────────────────────────────
  {
    code: "management_forecasting",
    title: "Management forecasts and planning",
    legislation: "Schedule 2, Paragraph 22, DPA 2018",
    category: "qualified",
    summary:
      "Personal data processed for management forecasting or management planning is exempt to the extent that disclosure would prejudice the conduct of the business.",
    legalTest:
      "Would disclosure prejudice the management planning or forecasting activity? This covers redundancy planning, restructuring, and similar business decisions not yet communicated.",
    draftParagraph:
      "Certain information relates to management forecasting or planning activities. Under Schedule 2, Paragraph 22 of the Data Protection Act 2018, this information is exempt from disclosure to the extent that providing it would be likely to prejudice the conduct of the business or activity concerned.",
    keywords: [
      "redundancy",
      "restructure",
      "reorganisation",
      "performance improvement plan",
      "pip",
      "capability",
      "business plan",
      "forecast",
    ],
  },

  // ─── Negotiations ──────────────────────────────────────────
  {
    code: "negotiations",
    title: "Negotiations with the data subject",
    legislation: "Schedule 2, Paragraph 23, DPA 2018",
    category: "qualified",
    summary:
      "Personal data consisting of a record of the data controller's intentions in relation to negotiations with the data subject is exempt to the extent that disclosure would prejudice those negotiations.",
    legalTest:
      "Is the information a record of your intentions regarding negotiations with this person? Would disclosure prejudice those negotiations?",
    draftParagraph:
      "Some information constitutes records of our intentions regarding negotiations. Under Schedule 2, Paragraph 23 of the Data Protection Act 2018, this information is exempt from disclosure to the extent that providing it would be likely to prejudice negotiations with you.",
    keywords: [
      "settlement",
      "negotiation",
      "offer",
      "compromise",
      "grievance",
      "mediation",
      "tribunal",
      "compensation",
    ],
  },

  // ─── Confidential references ───────────────────────────────
  {
    code: "confidential_reference",
    title: "Confidential employment references",
    legislation: "Schedule 2, Paragraph 24, DPA 2018",
    category: "absolute",
    summary:
      "Personal data consisting of a reference given (not received) in confidence for employment, education, or training purposes is exempt.",
    legalTest:
      "Was the reference given by your organisation (not received)? Was it given in confidence for the purpose of employment, education, training, or the provision of a service?",
    draftParagraph:
      "Certain information constitutes a confidential reference given by this organisation. Under Schedule 2, Paragraph 24 of the Data Protection Act 2018, personal data consisting of a reference given in confidence for employment purposes is exempt from the right of access.",
    keywords: [
      "reference",
      "referee",
      "employment reference",
      "character reference",
      "recommendation",
    ],
  },

  // ─── Regulatory functions ──────────────────────────────────
  {
    code: "regulatory_functions",
    title: "Regulatory functions",
    legislation: "Schedule 2, Paragraph 5, DPA 2018",
    category: "qualified",
    summary:
      "Personal data processed for regulatory functions (protecting the public, charities, fair competition) is exempt to the extent that disclosure would prejudice those functions.",
    legalTest:
      "Is the data processed for regulatory functions such as protecting the public from dishonesty, malpractice, or incompetence? Would disclosure prejudice the proper discharge of those functions?",
    draftParagraph:
      "Some information has been withheld under Schedule 2, Paragraph 5 of the Data Protection Act 2018. This information is processed for regulatory purposes, and its disclosure would be likely to prejudice the proper discharge of those functions.",
    keywords: [
      "regulatory",
      "compliance",
      "audit",
      "inspection",
      "safeguarding",
      "fitness to practise",
    ],
  },

  // ─── Health data causing serious harm ──────────────────────
  {
    code: "health_serious_harm",
    title: "Health data — serious harm to data subject or others",
    legislation: "Schedule 3, Paragraph 2 & Data Protection (Subject Access) (Fees and Miscellaneous Provisions) Regulations 2000",
    category: "qualified",
    summary:
      "Health data may be withheld if disclosure would be likely to cause serious harm to the physical or mental health of the data subject or another individual.",
    legalTest:
      "Would disclosure be likely to cause serious harm to the physical or mental health or condition of the data subject or any other person? This assessment should ideally be made by a health professional.",
    draftParagraph:
      "Some health-related information has been withheld on the basis that its disclosure would be likely to cause serious harm to the physical or mental health of the data subject or another individual. This assessment has been made in consultation with an appropriate health professional.",
    keywords: [
      "mental health",
      "medical",
      "health record",
      "occupational health",
      "counselling",
      "suicide",
      "self-harm",
      "psychiatric",
    ],
  },

  // ─── Manifestly unfounded or excessive (vexatious) ─────────
  {
    code: "manifestly_excessive",
    title: "Manifestly unfounded or excessive request",
    legislation: "Article 12(5), UK GDPR",
    category: "qualified",
    summary:
      "You may refuse a request or charge a reasonable fee if it is manifestly unfounded or excessive, particularly if it is repetitive.",
    legalTest:
      "Is the request manifestly unfounded (e.g., made with no real intention of exercising data rights, intended to harass) or manifestly excessive (e.g., repetitive, overlapping with previous requests)? The burden of proof is on the controller.",
    draftParagraph:
      "Having considered your request, we have determined that it is manifestly [unfounded/excessive] within the meaning of Article 12(5) of the UK GDPR. [Explain reasoning — e.g., this is your Nth substantially similar request within X months / the request appears intended to cause disruption rather than to exercise your data protection rights]. You have the right to complain to the Information Commissioner's Office if you disagree with this assessment.",
    keywords: [
      "vexatious",
      "repeated",
      "harassment",
      "multiple requests",
      "frivolous",
      "burden",
      "disproportionate",
    ],
  },

  // ─── Information available by other means ──────────────────
  {
    code: "available_elsewhere",
    title: "Information already provided or publicly available",
    legislation: "Article 12(5)(b) & Recital 62, UK GDPR",
    category: "qualified",
    summary:
      "If the data subject already has the information, or it is publicly available, you may not need to provide it again — but you must still confirm you process their data.",
    legalTest:
      "Has the data subject already been provided with this information? Is it publicly available? Note: you must still confirm what data you process, even if you don't re-supply copies.",
    draftParagraph:
      "We note that some of the information within the scope of your request has been previously provided to you [on DATE / in response to your earlier request dated DATE]. In accordance with the UK GDPR, we have not duplicated information already in your possession, though we confirm the categories of data we process about you.",
    keywords: [
      "already provided",
      "duplicate",
      "previous request",
      "publicly available",
      "same information",
    ],
  },
];

/**
 * Look up an exemption by its code.
 */
export function getExemption(code: string): Exemption | undefined {
  return EXEMPTIONS.find((e) => e.code === code);
}

/**
 * Return all exemption codes grouped by category.
 */
export function exemptionsByCategory() {
  const absolute = EXEMPTIONS.filter((e) => e.category === "absolute");
  const qualified = EXEMPTIONS.filter((e) => e.category === "qualified");
  return { absolute, qualified };
}
