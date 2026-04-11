"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  sarId: string;
  initialDraftSubject: string;
  initialDraftBody: string;
  requesterEmail: string;
  currentStatus: string;
}

const TEMPLATE_OPTIONS = [
  { value: "acknowledge", label: "Acknowledgement" },
  { value: "extension", label: "Extension notification" },
  { value: "final", label: "Final response" },
  { value: "exemption", label: "Exemption / refusal" },
];

export function SarWorkflow({
  sarId,
  initialDraftSubject,
  initialDraftBody,
  requesterEmail,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [template, setTemplate] = useState("acknowledge");
  const [subject, setSubject] = useState(initialDraftSubject);
  const [body, setBody] = useState(initialDraftBody);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/sar/${sarId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType: template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Draft failed");
      setSubject(data.draft.subject);
      setBody(data.draft.body);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required");
      return;
    }
    const confirmMsg = `Send this response to ${requesterEmail}?\n\n(If MAIL_SEND_MODE=draft it will be saved to your Outlook Drafts folder instead.)`;
    if (!confirm(confirmMsg)) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sarId,
          to: requesterEmail,
          subject,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Send failed");
      setSuccessMessage(
        data.mode === "sent"
          ? "Response sent and logged to this SAR."
          : "Draft created in your Outlook Drafts folder."
      );
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="stat-label">AI response draft</div>
          <p className="mt-2 text-sm text-white/60">
            Pick a template, let Claude fill in the details, review, and send.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs text-white"
          >
            {TEMPLATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={generating}
            className="pill pill-secondary text-xs disabled:opacity-50"
          >
            {generating ? "Drafting..." : "Generate draft"}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div>
          <label className="stat-label">To</label>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70">
            {requesterEmail}
          </div>
        </div>
        <div>
          <label className="stat-label">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line will appear here once generated"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="stat-label">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Response body will appear here once generated. Edit freely before sending."
            rows={16}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-white/20 bg-white/[0.02] p-3 text-xs text-white/70">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mt-4 rounded-xl border border-white/20 bg-white/[0.02] p-3 text-xs text-white/80">
          {successMessage}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="text-[11px] text-white/40">
          Current status: <span className="text-white/70">{currentStatus}</span>
        </div>
        <button
          onClick={send}
          disabled={sending || !subject || !body}
          className="pill pill-primary text-sm disabled:opacity-50"
        >
          {sending ? "Sending..." : "Approve & send"}
        </button>
      </div>
    </section>
  );
}
