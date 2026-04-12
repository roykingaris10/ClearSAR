import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";

export default async function Home() {
  const session = await getSession();
  if (session.userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Decorative azure glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-azure-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-[-10%] h-[480px] w-[480px] rounded-full bg-azure-100/50 blur-3xl"
      />

      {/* Top nav */}
      <nav className="glass-nav sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <Logo size="md" />
          <a href="/api/auth/login" className="pill pill-secondary text-xs">
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-1 items-center justify-center px-8 py-20">
        <div className="stagger relative w-full max-w-4xl text-center">
          <span className="tag-azure mx-auto">For Data Protection Officers</span>

          <h1 className="mt-8 text-6xl font-semibold tracking-tight text-ink sm:text-7xl">
            We&apos;ve got your
            <br className="hidden sm:block" />{" "}
            back
            <span className="text-ink">(</span>
            <em className="font-bold italic text-azure-500">log</em>
            <span className="text-ink">).</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-ink-muted">
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

          <p className="mt-8 text-xs text-ink-subtle">
            Article 15 · UK GDPR · 30-day statutory deadline
          </p>
        </div>
      </section>

      {/* Feature rail */}
      <section className="relative mx-auto mb-16 w-full max-w-6xl px-8">
        <div className="glass grid grid-cols-1 divide-y divide-ink/[0.06] overflow-hidden rounded-3xl sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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
        </div>
      </section>

      <footer className="hairline-t bg-white/40 px-8 py-6 text-center text-xs text-ink-subtle backdrop-blur">
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
      <div className="stat-label text-azure-600">{label}</div>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
