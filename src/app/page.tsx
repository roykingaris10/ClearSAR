import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  ScanSearch,
  PenLine,
  Send,
  Calendar,
  Scale,
  ClipboardCheck,
  ShieldCheck,
  LogIn,
  ArrowRight,
} from "lucide-react";

export default async function Home() {
  const session = await getSession();
  if (session.userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Top nav */}
      <nav className="glass-nav sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <Logo size="md" />
          <a href="/api/auth/login" className="pill pill-secondary inline-flex items-center gap-1.5 text-xs">
            <LogIn size={13} strokeWidth={2} />
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-1 items-center justify-center px-8 py-24 sm:py-32">
        <div className="stagger relative w-full max-w-3xl">
          <div className="tag-azure">For Data Protection Officers</div>

          <h1 className="mt-8 text-5xl font-medium tracking-tight text-ink sm:text-6xl lg:text-[68px] lg:leading-[1.05]">
            We&apos;ve got your
            <br />{" "}
            back<span className="text-ink/40">(</span><em className="font-semibold italic text-azure-500">log</em><span className="text-ink/40">)</span>.
          </h1>

          <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-ink-muted">
            ClearSAR connects to your Outlook, identifies Subject Access
            Requests, and drafts statutory responses for your approval.
            Built for the messy reality of a 300-email backlog.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <a
              href="/api/auth/login"
              className="pill pill-primary inline-flex items-center gap-2 px-5 py-2.5"
            >
              Connect Outlook
              <ArrowRight size={15} strokeWidth={2} />
            </a>
            <span className="text-[13px] text-ink-subtle">
              UK GDPR &middot; 30-day deadline &middot; ICO-ready audit trail
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative mx-auto w-full max-w-5xl px-8 pb-20">
        <div className="stat-label mb-8">How it works</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Step
            number="1"
            title="Scan"
            body="Connect your Outlook. Every email gets triaged by a UK-GDPR-trained classifier in seconds."
            icon={<ScanSearch size={16} strokeWidth={2} />}
          />
          <Step
            number="2"
            title="Draft"
            body="Your approved templates, populated with case-specific facts. Review and edit before anything leaves."
            icon={<PenLine size={16} strokeWidth={2} />}
          />
          <Step
            number="3"
            title="Send"
            body="Approve and send from your mailbox. Every action logged and timestamped for ICO audit."
            icon={<Send size={16} strokeWidth={2} />}
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="hairline-t hairline-b bg-white/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6 px-8 py-8">
          <Stat value="30 days" label="Statutory deadline" icon={<Calendar size={14} strokeWidth={2} className="text-azure-500" />} />
          <Stat value="Art. 15" label="UK GDPR" icon={<Scale size={14} strokeWidth={2} className="text-azure-500" />} />
          <Stat value="100%" label="Audit trail" icon={<ClipboardCheck size={14} strokeWidth={2} className="text-azure-500" />} />
          <Stat value="0" label="Emails sent without approval" icon={<ShieldCheck size={14} strokeWidth={2} className="text-azure-500" />} />
        </div>
      </section>

      <footer className="px-8 py-8 text-center text-[13px] text-ink-subtle">
        ClearSAR &middot; Not legal advice &middot; Built for DPOs
      </footer>
    </main>
  );
}

function Step({
  number,
  title,
  body,
  icon,
}: {
  number: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card group">
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-azure-50 text-azure-600">
        {icon}
      </div>
      <h3 className="text-lg font-medium tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-lg font-medium tracking-tight text-ink">{icon}{value}</div>
      <div className="text-[12px] text-ink-subtle">{label}</div>
    </div>
  );
}
