"use client";

import { useState } from "react";

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
      <div className="card text-sm text-white/60">
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
            className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
              t.id === activeId
                ? "bg-white text-black"
                : "bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
            }`}
          >
            <div className="font-medium">{t.name}</div>
            <div
              className={`text-[11px] ${
                t.id === activeId ? "text-black/60" : "text-white/40"
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
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="stat-label">Subject</label>
          <input
            type="text"
            value={active.subject}
            onChange={(e) => update("subject", e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="stat-label">Body</label>
          <textarea
            value={active.body}
            onChange={(e) => update("body", e.target.value)}
            rows={20}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white focus:border-white/30 focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-white/40">
            Placeholders:{" "}
            <code>{"{{requester_name}}"}</code>,{" "}
            <code>{"{{received_date}}"}</code>,{" "}
            <code>{"{{due_date}}"}</code>,{" "}
            <code>{"{{sar_reference}}"}</code>,{" "}
            <code>{"{{dpo_name}}"}</code>,{" "}
            <code>{"{{organisation_name}}"}</code>
          </div>
          <button
            onClick={save}
            disabled={savingId === active.id}
            className="pill pill-primary text-xs disabled:opacity-50"
          >
            {savingId === active.id
              ? "Saving..."
              : savedId === active.id
                ? "Saved"
                : "Save template"}
          </button>
        </div>
      </div>
    </div>
  );
}
