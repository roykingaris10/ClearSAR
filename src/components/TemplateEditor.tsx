"use client";

import { useState } from "react";
import { Save, FileText, Check, Code2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
}

export function TemplateEditor({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const active = templates.find((t) => t.id === activeId);

  function update(field: "subject" | "body" | "name", value: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, [field]: value } : t))
    );
  }

  async function save() {
    if (!active) return;
    setSavingId(active.id);
    try {
      const res = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: active.id,
          name: active.name,
          subject: active.subject,
          body: active.body,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSavedId(active.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  }

  if (!active) {
    return (
      <div className="card text-sm text-ink-muted">
        No templates found. Sign out and back in to seed defaults.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-1">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-all ${
              t.id === activeId
                ? "bg-azure-500 text-white shadow-azure-glow"
                : "bg-white/70 text-ink backdrop-blur hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium"><FileText size={13} strokeWidth={2} />{t.name}</div>
            <div
              className={`text-[11px] ${
                t.id === activeId ? "text-white/70" : "text-ink-subtle"
              }`}
            >
              {t.type}
            </div>
          </button>
        ))}
      </aside>

      <div className="card space-y-4">
        <div>
          <label className="stat-label">Name</label>
          <input
            type="text"
            value={active.name}
            onChange={(e) => update("name", e.target.value)}
            className="input-field mt-2"
          />
        </div>
        <div>
          <label className="stat-label">Subject</label>
          <input
            type="text"
            value={active.subject}
            onChange={(e) => update("subject", e.target.value)}
            className="input-field mt-2"
          />
        </div>
        <div>
          <label className="stat-label">Body</label>
          <textarea
            value={active.body}
            onChange={(e) => update("body", e.target.value)}
            rows={20}
            className="input-field mt-2 resize-none leading-relaxed"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-1 text-[11px] text-ink-subtle">
            <Code2 size={11} strokeWidth={2} className="mt-0.5 shrink-0" />
            Placeholders:{" "}
            <code className="rounded bg-azure-50 px-1 text-azure-700">
              {"{{requester_name}}"}
            </code>
            ,{" "}
            <code className="rounded bg-azure-50 px-1 text-azure-700">
              {"{{received_date}}"}
            </code>
            ,{" "}
            <code className="rounded bg-azure-50 px-1 text-azure-700">
              {"{{due_date}}"}
            </code>
            ,{" "}
            <code className="rounded bg-azure-50 px-1 text-azure-700">
              {"{{sar_reference}}"}
            </code>
            ,{" "}
            <code className="rounded bg-azure-50 px-1 text-azure-700">
              {"{{dpo_name}}"}
            </code>
            ,{" "}
            <code className="rounded bg-azure-50 px-1 text-azure-700">
              {"{{organisation_name}}"}
            </code>
          </div>
          <button
            onClick={save}
            disabled={savingId === active.id}
            className="pill pill-primary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
          >
            {savingId === active.id
              ? "Saving..."
              : savedId === active.id
                ? <><Check size={13} strokeWidth={2.5} />Saved</>
                : <><Save size={13} strokeWidth={2} />Save template</>}
          </button>
        </div>
      </div>
    </div>
  );
}
