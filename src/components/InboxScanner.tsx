"use client";

import { useState } from "react";

interface ScanResult {
  message: {
    id: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    receivedDate: string;
    bodyPreview: string;
    body: string;
  };
  classification: {
    is_sar: boolean;
    confidence: number;
    requester_name: string | null;
    requester_email: string | null;
    sar_type: string | null;
    reasoning: string;
  };
}

export function InboxScanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResult[] | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [top, setTop] = useState(25);

  async function scan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mail/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ top }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? data.error ?? "Scan failed");
      }
      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addToQueue(r: ScanResult) {
    try {
      const res = await fetch("/api/sar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlookMessageId: r.message.id,
          subject: r.message.subject,
          requesterName:
            r.classification.requester_name ?? r.message.fromName,
          requesterEmail:
            r.classification.requester_email ?? r.message.fromEmail,
          receivedDate: r.message.receivedDate,
          emailBody: r.message.body || r.message.bodyPreview,
          aiClassificationScore: r.classification.confidence,
          sarType: r.classification.sar_type,
        }),
      });
      if (!res.ok) throw new Error("Failed to add SAR");
      setAddedIds((prev) => new Set(prev).add(r.message.id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  function dismiss(id: string) {
    setDismissedIds((prev) => new Set(prev).add(id));
  }

  const visible = (results ?? [])
    .filter((r) => !dismissedIds.has(r.message.id))
    .sort(
      (a, b) => b.classification.confidence - a.classification.confidence
    );

  const sarCount = (results ?? []).filter((r) => r.classification.is_sar)
    .length;
  const possibleCount = (results ?? []).filter(
    (r) =>
      !r.classification.is_sar &&
      r.classification.confidence >= 0.4
  ).length;

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Connected to your Outlook</div>
          {results && (
            <div className="mt-1 text-xs text-white/50">
              Scanned {results.length} messages · {sarCount} SARs detected ·{" "}
              {possibleCount} possible
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/50">
            Scan
            <select
              value={top}
              onChange={(e) => setTop(Number(e.target.value))}
              className="rounded-full border border-white/15 bg-black px-3 py-1 text-xs text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            messages
          </label>
          <button
            onClick={scan}
            disabled={loading}
            className="pill pill-primary text-sm disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Scan inbox"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-white/20 bg-white/[0.02] p-4 text-sm text-white/70">
          {error}
        </div>
      )}

      {loading && (
        <div className="card text-center text-sm text-white/50">
          Reading your mailbox and classifying each message...
        </div>
      )}

      {results && visible.length === 0 && !loading && (
        <div className="card text-center text-sm text-white/50">
          No messages to review. Try scanning more messages.
        </div>
      )}

      <div className="space-y-3">
        {visible.map((r) => {
          const added = addedIds.has(r.message.id);
          const confidencePct = Math.round(r.classification.confidence * 100);
          const isSar = r.classification.is_sar;
          return (
            <div
              key={r.message.id}
              className={`rounded-2xl border p-6 transition-all ${
                isSar
                  ? "border-white/20 bg-white/[0.03]"
                  : "border-white/[0.08] bg-white/[0.01]"
              }`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="tag">
                      {isSar
                        ? `SAR · ${confidencePct}%`
                        : `Not SAR · ${confidencePct}%`}
                    </span>
                    {r.classification.sar_type && (
                      <span className="tag">{r.classification.sar_type}</span>
                    )}
                  </div>
                  <div className="mt-3 truncate text-base font-medium">
                    {r.message.subject}
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    From {r.message.fromName} · {r.message.fromEmail} ·{" "}
                    {new Date(r.message.receivedDate).toLocaleDateString(
                      "en-GB"
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-white/60">
                    {r.message.bodyPreview}
                  </p>
                  {r.classification.reasoning && (
                    <p className="mt-3 text-xs italic text-white/40">
                      AI: {r.classification.reasoning}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {added ? (
                    <span className="pill border border-white/20 text-xs text-white/60">
                      Added to queue
                    </span>
                  ) : (
                    <button
                      onClick={() => addToQueue(r)}
                      className="pill pill-primary text-xs"
                    >
                      Add to queue
                    </button>
                  )}
                  <button
                    onClick={() => dismiss(r.message.id)}
                    className="pill pill-ghost text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
