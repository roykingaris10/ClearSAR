# ClearSAR

**Clear your Subject Access Request backlog. Directly from Outlook.**

ClearSAR is a web app for Data Protection Officers. It connects to your
Outlook mailbox, identifies Subject Access Requests using AI, drafts
statutory-compliant responses from your approved templates, and lets you
review, edit, approve, and send — logging every action for ICO audit.

Built for the messy reality of a 300-email backlog sitting in a shared inbox.

---

## Features (Phase 1 MVP)

- **Microsoft Graph sign-in** — OAuth 2.0 with PKCE. Your tokens are encrypted
  at rest with AES-256-GCM.
- **Inbox Scanner** — fetches recent messages from your mailbox and classifies
  each one as a SAR using Claude, with a confidence score and reasoning.
- **SAR Queue** — every identified request, with auto-calculated 30-day
  deadlines and overdue flags.
- **AI Response Drafting** — pick from five default templates (acknowledge,
  extension, department chaser, final, exemption), Claude fills in the
  placeholders, you edit freely.
- **Send or Draft mode** — start in draft mode (responses appear in your
  Outlook Drafts folder for manual review). Flip to live send once you trust
  the outputs.
- **Dashboard** — hero backlog number, ICO risk assessment, overdue
  distribution, clearance projection, and most-critical SAR.
- **Activity log** — every action (AI classification, draft generation,
  approval, send) is timestamped and stored per-SAR for audit.
- **Apple-aesthetic UI** — black and white, generous spacing, SF Pro system
  fonts, 1px hairlines.

---

## Tech stack

- **Next.js 14** (App Router, TypeScript, server actions)
- **Tailwind CSS** for styling
- **Microsoft Graph API** via `@microsoft/microsoft-graph-client`
- **Microsoft MSAL Node** for OAuth
- **Anthropic Claude Sonnet 4** for classification and drafting
- **Prisma + SQLite** (swap to PostgreSQL for production)
- **iron-session** for encrypted HTTP-only session cookies

---

## Quick start

### 1. Register an Azure app

1. Go to <https://portal.azure.com> → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Name: `ClearSAR`
3. Supported account types: *Accounts in this organizational directory only (single tenant)*
4. Redirect URI: `Web` → `http://localhost:3000/api/auth/callback`
5. After creation, go to **Certificates & secrets** → **New client secret** → copy the value
6. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions** and add:
   - `User.Read`
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `offline_access`
7. Click **Grant admin consent** (if you have the rights — you may need to ask your IT admin)

Collect these three values:
- **Application (client) ID** → `AZURE_CLIENT_ID`
- **Client secret value** → `AZURE_CLIENT_SECRET`
- **Directory (tenant) ID** → `AZURE_TENANT_ID`

### 2. Set environment variables

```bash
cp .env.example .env
```

Fill in:

```env
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
AZURE_REDIRECT_URI=http://localhost:3000/api/auth/callback

ANTHROPIC_API_KEY=sk-ant-...

# At least 32 random characters — used to encrypt session cookies and tokens
SESSION_SECRET=$(openssl rand -hex 32)

DATABASE_URL="file:./dev.db"

# Keep this on "draft" for testing — responses go to your Outlook Drafts folder
# instead of being sent.
MAIL_SEND_MODE=draft

ORGANISATION_NAME="Your Organisation Ltd"
DPO_NAME="Your Name"
DPO_EMAIL=dpo@your-org.co.uk
```

### 3. Install and run

```bash
npm install
npx prisma db push
npm run dev
```

Open <http://localhost:3000>.

### 4. Test the flow

1. Click **Connect Outlook** on the landing page
2. Sign in with your work account and grant the requested permissions
3. Navigate to **Inbox** and click **Scan inbox**
4. Review the AI classifications and **Add to queue** for any real SARs
5. Open a SAR from the **Queue**
6. Click **Generate draft**, review the output, edit if needed
7. Click **Approve & send** — the response will be saved to your **Outlook Drafts folder** (because `MAIL_SEND_MODE=draft`)
8. Verify it looks right inside Outlook before flipping to `MAIL_SEND_MODE=send`

---

## Safety notes for DPOs

ClearSAR itself processes personal data from SARs and sends email content to
Claude for classification and drafting. Before using it with real SAR
correspondence in production:

- **DPIA** — document the processing in a Data Protection Impact Assessment.
  Cover lawful basis, data minimisation, Anthropic's role as a sub-processor,
  retention periods, and access controls.
- **ROPA** — add ClearSAR to your Record of Processing Activities.
- **Data retention** — the default SQLite database stores SAR email bodies.
  Purge completed SARs on your normal retention schedule.
- **Draft mode first** — keep `MAIL_SEND_MODE=draft` until you have reviewed
  at least 20-30 AI drafts and are confident in quality. The AI does not see
  redacted data or know your organisation's internal rules.
- **Human approval is non-negotiable** — ClearSAR is a workflow accelerator,
  not a replacement for the DPO's judgment. Every outbound response is signed
  off by a human.

---

## Build order

Phase 1 (this repo): **auth → scan → classify → draft → send → log**.

Later phases (in the spec, not yet built):
- Phase 2: bulk actions, department chasers, deadline alerts
- Phase 3: richer dashboard, compliance report export
- Phase 4: Excel sync (local + OneDrive), shared mailbox support, exemption logger

---

## Licence

Private. Do not distribute without permission.
