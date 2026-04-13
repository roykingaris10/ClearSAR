"use client";

import { useState } from "react";
import { Shield, ShieldPlus, ShieldCheck, X, Sparkles } from "lucide-react";
import { EXEMPTIONS } from "@/lib/exemptions";

interface AppliedExemption {
  id: string;
  exemptionCode: string;
  legislation: string;
  description: string;
  reasoning: string;
  aiSuggested: boolean;
}

export function ExemptionPicker({
  sarId,
  initial,
}: {
  sarId: string;
  initial: AppliedExemption[];
}) {
  const [applied, setApplied] = useState<AppliedExemption[]>(initial);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCode, setSelectedCode] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [saving, setSaving] = useState(false);

  const appliedCodes = new Set(applied.map((e) => e.exemptionCode));
  const available = EXEMPTIONS.filter((e) => !appliedCodes.has(e.code));

  const selectedExemption = EXEMPTIONS.find((e) => e.code === selectedCode);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCode || !reasoning) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/sar/${sarId}/exemptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exemptionCode: selectedCode, reasoning }),
      });
      if (!res.ok) throw new Error("Failed to apply exemption");
      const { exemption } = await res.json();
      setApplied((prev) => [exemption, ...prev]);
      setSelectedCode("");
      setReasoning("");
      setShowPicker(false);
    } catch {
      // silent for now
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(exemptionId: string) {
    const res = await fetch(`/api/sar/${sarId}/exemptions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exemptionId }),
    });
    if (res.ok) {
      setApplied((prev) => prev.filter((e) => e.id !== exemptionId));
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="stat-label flex items-center gap-1.5"><Shield size={13} strokeWidth={2} />Exemptions applied</div>
        {!showPicker && available.length > 0 && (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 text-[11px] text-azure-600 hover:text-azure-700 font-medium"
          >
            <ShieldPlus size={12} strokeWidth={2} />
            Add exemption
          </button>
        )}
      </div>

      {/* Applied exemptions */}
      {applied.length === 0 && !showPicker && (
        <p className="text-xs text-ink-subtle py-2">
          No exemptions applied. Use the AI advisory to identify applicable exemptions, or add manually.
        </p>
      )}

      {applied.map((ex) => (
        <div
          key={ex.id}
          className="group rounded-lg bg-canvas p-3 space-y-1.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-ink">{ex.description}</span>
              {ex.aiSuggested && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-azure-600 bg-azure-50 rounded-full px-1.5 py-0.5 font-medium">
                  <Sparkles size={8} strokeWidth={2.5} />
                  AI
                </span>
              )}
            </div>
            <button
              onClick={() => handleRemove(ex.id)}
              className="flex items-center gap-0.5 text-[10px] text-ink-subtle hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <X size={11} strokeWidth={2} />
              Remove
            </button>
          </div>
          <div className="text-[10px] text-ink-subtle">{ex.legislation}</div>
          <div className="text-[11px] text-ink-muted">{ex.reasoning}</div>
        </div>
      ))}

      {/* Picker form */}
      {showPicker && (
        <form onSubmit={handleApply} className="space-y-3 rounded-lg border border-azure-200 bg-azure-50/30 p-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Exemption
            </label>
            <select
              className="input-field"
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              required
            >
              <option value="">Select an exemption...</option>
              {available.map((ex) => (
                <option key={ex.code} value={ex.code}>
                  {ex.title} ({ex.category}) — {ex.legislation}
                </option>
              ))}
            </select>
          </div>

          {selectedExemption && (
            <div className="text-[11px] text-ink-muted bg-white rounded-lg p-2.5 space-y-1">
              <div className="font-medium text-ink text-xs">{selectedExemption.title}</div>
              <p>{selectedExemption.summary}</p>
              <p className="italic">{selectedExemption.legalTest}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Your reasoning for applying this exemption
            </label>
            <textarea
              className="input-field min-h-[60px] resize-y"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain why this exemption applies to this SAR..."
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="pill-primary inline-flex items-center gap-1.5">
              <ShieldCheck size={14} strokeWidth={2} />
              {saving ? "Applying..." : "Apply exemption"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPicker(false);
                setSelectedCode("");
                setReasoning("");
              }}
              className="pill-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
