"use client";

import { useState } from "react";

interface Advisory {
  validity: { is_valid: boolean; issues: string[]; guidance: string };
  suggestedExemptions: Array<{ code: string; reason: string; confidence: number }>;
  vexatious: { likely: boolean; reasoning: string };
  extension: { recommended: boolean; reasoning: string };
  fee: { chargeable: boolean; reasoning: string };
  complexity: "simple" | "moderate" | "complex";
  suggestedDepartments: string[];
  priorityScore: number;
  summary: string;
}

export function AdvisoryPanel({
  sarId,
  initial,
}: {
  sarId: string;
  initial: Advisory | null;
}) {
  const [advisory, setAdvisory] = useState<Advisory | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sar/${sarId}/advisory`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? data.error);
      }
      const { advisory: adv } = await res.json();
      setAdvisory(adv);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!advisory) {
    return (
      <div className="card">
        <div className="stat-label">AI Advisory</div>
        <div className="mt-4 text-center py-8">
          <p className="text-sm text-ink-subtle">
            Generate contextual guidance for this SAR — validity checks,
            exemption suggestions, priority scoring, and recommended actions.
          </p>
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="pill-primary mt-4"
          >
            {loading ? "Analysing..." : "Generate advisory"}
          </button>
        </div>
      </div>
    );
  }

  const complexityColor = {
    simple: "text-emerald-600 bg-emerald-50",
    moderate: "text-amber-600 bg-amber-50",
    complex: "text-red-600 bg-red-50",
  }[advisory.complexity];

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <div className="stat-label">AI Advisory</div>
        <button
          onClick={generate}
          disabled={loading}
          className="text-[11px] text-ink-subtle hover:text-azure-600 transition-colors"
        >
          {loading ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      {/* Summary */}
      <p className="text-sm text-ink leading-relaxed">{advisory.summary}</p>

      {/* Key indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-canvas px-3 py-2.5 text-center">
          <div className="text-2xl font-semibold text-ink">
            {advisory.priorityScore}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle">
            Priority
          </div>
        </div>
        <div className="rounded-lg bg-canvas px-3 py-2.5 text-center">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${complexityColor}`}
          >
            {advisory.complexity}
          </span>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-subtle">
            Complexity
          </div>
        </div>
        <div className="rounded-lg bg-canvas px-3 py-2.5 text-center">
          <div
            className={`text-lg font-semibold ${advisory.validity.is_valid ? "text-emerald-600" : "text-red-600"}`}
          >
            {advisory.validity.is_valid ? "Valid" : "Issues"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle">
            Validity
          </div>
        </div>
      </div>

      {/* Validity issues */}
      {advisory.validity.issues.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Validity issues
          </div>
          <ul className="mt-2 space-y-1">
            {advisory.validity.issues.map((issue, i) => (
              <li key={i} className="text-xs text-amber-800 flex gap-2">
                <span className="shrink-0">-</span>
                {issue}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700">{advisory.validity.guidance}</p>
        </div>
      )}

      {/* Vexatious / Extension / Fee row */}
      <div className="space-y-3">
        {advisory.vexatious.likely && (
          <div className="rounded-lg bg-red-50 p-3">
            <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
              Potentially vexatious
            </div>
            <p className="mt-1 text-xs text-red-700">{advisory.vexatious.reasoning}</p>
          </div>
        )}

        {advisory.extension.recommended && (
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Extension recommended
            </div>
            <p className="mt-1 text-xs text-blue-700">{advisory.extension.reasoning}</p>
          </div>
        )}

        {advisory.fee.chargeable && (
          <div className="rounded-lg bg-violet-50 p-3">
            <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
              Fee chargeable
            </div>
            <p className="mt-1 text-xs text-violet-700">{advisory.fee.reasoning}</p>
          </div>
        )}
      </div>

      {/* Suggested exemptions */}
      {advisory.suggestedExemptions.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Suggested exemptions
          </div>
          <div className="mt-2 space-y-2">
            {advisory.suggestedExemptions.map((ex, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-canvas p-3">
                <div className="shrink-0 mt-0.5">
                  <span className="tag-azure text-[10px]">
                    {Math.round(ex.confidence * 100)}%
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-ink">
                    {ex.code.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5">{ex.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested departments */}
      {advisory.suggestedDepartments.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Recommended departments
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {advisory.suggestedDepartments.map((dept) => (
              <span key={dept} className="tag">
                {dept}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
