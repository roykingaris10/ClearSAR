import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session.userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col">
      {/* Top nav */}
      <nav className="hairline-b flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-white" />
          <span className="text-sm font-semibold tracking-tight">ClearSAR</span>
        </div>
        <a
          href="/api/auth/login"
          className="pill pill-secondary text-xs"
        >
          Sign in
        </a>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 items-center justify-center px-8">
        <div className="stagger max-w-3xl text-center">
          <span className="tag mx-auto">For Data Protection Officers</span>
          <h1 className="mt-8 text-6xl font-semibold tracking-tight sm:text-7xl">
            Clear your SAR
            <br />
            <span className="text-white/50">backlog.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-white/60">
            ClearSAR connects to your Outlook inbox, identifies Subject Access
            Requests, and drafts statutory responses for your approval. Built
            for the messy reality of a 300-email backlog.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/api/auth/login"
              className="pill pill-primary px-6 py-3 text-sm"
            >
              Connect Outlook
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <p className="mt-8 text-xs text-white/30">
            Article 15 · UK GDPR · 30-day statutory deadline
          </p>
        </div>
      </section>

      {/* Feature rail */}
      <section className="hairline-t grid grid-cols-1 divide-y divide-white/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Feature
          label="01"
          title="Scan"
          body="Every email in your inbox triaged in seconds by a UK-GDPR-trained classifier."
        />
        <Feature
          label="02"
          title="Draft"
          body="Your approved templates, populated with case-specific facts. Review and edit freely."
        />
        <Feature
          label="03"
          title="Send"
          body="Approve and send from your mailbox — every action logged for ICO audit."
        />
      </section>

      <footer className="hairline-t px-8 py-6 text-center text-xs text-white/30">
        ClearSAR · Not legal advice · Built for DPOs
      </footer>
    </main>
  );
}

function Feature({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="p-10">
      <div className="stat-label">{label}</div>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{body}</p>
    </div>
  );
}
