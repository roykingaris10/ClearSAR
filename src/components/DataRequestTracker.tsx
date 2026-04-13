"use client";

import { useState } from "react";
import { FolderSearch, Send, Bell, CheckCircle, Building2, Plus } from "lucide-react";

interface DataReq {
  id: string;
  status: string;
  sentAt: string | null;
  chasedAt: string | null;
  receivedAt: string | null;
  chaseCount: number;
  requestNote: string | null;
  responseNote: string | null;
  department: {
    id: string;
    name: string;
    contactName: string | null;
    contactEmail: string;
  };
}

interface Dept {
  id: string;
  name: string;
  contactEmail: string;
}

export function DataRequestTracker({
  sarId,
  initial,
  departments,
}: {
  sarId: string;
  initial: DataReq[];
  departments: Dept[];
}) {
  const [requests, setRequests] = useState<DataReq[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [requestNote, setRequestNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const requestedDeptIds = new Set(requests.map((r) => r.department.id));
  const availableDepts = departments.filter((d) => !requestedDeptIds.has(d.id));

  function toggleDept(id: string) {
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDepts.length === 0) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/sar/${sarId}/data-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentIds: selectedDepts, requestNote }),
      });
      if (res.ok) {
        const { dataRequests } = await res.json();
        setRequests((prev) => [...dataRequests, ...prev]);
        setSelectedDepts([]);
        setRequestNote("");
        setShowAdd(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function markReceived(dataRequestId: string) {
    setActionLoading(dataRequestId);
    try {
      const res = await fetch(`/api/sar/${sarId}/data-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataRequestId, status: "received" }),
      });
      if (res.ok) {
        const { dataRequest } = await res.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === dataRequestId ? dataRequest : r))
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function chase(dataRequestId: string) {
    setActionLoading(dataRequestId);
    try {
      const res = await fetch(`/api/sar/${sarId}/data-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataRequestId, chase: true }),
      });
      if (res.ok) {
        const { dataRequest } = await res.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === dataRequestId ? dataRequest : r))
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  const statusStyle: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    sent: "bg-blue-50 text-blue-700",
    chased: "bg-orange-50 text-orange-700",
    received: "bg-emerald-50 text-emerald-700",
    overdue: "bg-red-50 text-red-700",
  };

  const totalReceived = requests.filter((r) => r.status === "received").length;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="stat-label flex items-center gap-1.5">
          <FolderSearch size={13} strokeWidth={2} />
          Data collection
          {requests.length > 0 && (
            <span className="ml-2 text-ink-subtle font-normal">
              {totalReceived}/{requests.length} received
            </span>
          )}
        </div>
        {!showAdd && availableDepts.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-[11px] text-azure-600 hover:text-azure-700 font-medium"
          >
            <Plus size={12} strokeWidth={2.5} />
            Request data
          </button>
        )}
      </div>

      {/* Empty state */}
      {requests.length === 0 && !showAdd && (
        <div className="text-center py-6">
          <p className="text-xs text-ink-subtle">
            No data collection requests yet.
          </p>
          {departments.length === 0 ? (
            <p className="mt-1 text-[11px] text-ink-subtle">
              <a href="/departments" className="text-azure-600 hover:underline">
                Add departments
              </a>{" "}
              first to track data collection.
            </p>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="pill-primary mt-3 inline-flex items-center gap-1.5"
            >
              <Send size={13} strokeWidth={2} />
              Request data from departments
            </button>
          )}
        </div>
      )}

      {/* Active requests */}
      {requests.map((r) => (
        <div key={r.id} className="rounded-lg bg-canvas p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink">
                {r.department.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle[r.status] ?? "bg-gray-50 text-gray-700"}`}
              >
                {r.status}
              </span>
            </div>
            <div className="flex gap-1.5">
              {r.status !== "received" && (
                <>
                  <button
                    onClick={() => chase(r.id)}
                    disabled={actionLoading === r.id}
                    className="flex items-center gap-0.5 text-[10px] text-orange-600 hover:text-orange-700 font-medium px-1.5 py-0.5 rounded hover:bg-orange-50"
                  >
                    <Bell size={10} strokeWidth={2.5} />
                    {r.chaseCount > 0
                      ? `Chase again (${r.chaseCount})`
                      : "Chase"}
                  </button>
                  <button
                    onClick={() => markReceived(r.id)}
                    disabled={actionLoading === r.id}
                    className="flex items-center gap-0.5 text-[10px] text-emerald-600 hover:text-emerald-700 font-medium px-1.5 py-0.5 rounded hover:bg-emerald-50"
                  >
                    <CheckCircle size={10} strokeWidth={2.5} />
                    Mark received
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-ink-subtle">
            {r.department.contactEmail}
          </div>
          {r.requestNote && (
            <div className="mt-1.5 text-[11px] text-ink-muted">{r.requestNote}</div>
          )}
        </div>
      ))}

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-azure-200 bg-azure-50/30 p-4 space-y-3"
        >
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Select departments
          </div>
          <div className="flex flex-wrap gap-2">
            {availableDepts.map((dept) => {
              const selected = selectedDepts.includes(dept.id);
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => toggleDept(dept.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium border transition-colors ${
                    selected
                      ? "border-azure-400 bg-azure-500 text-white"
                      : "border-ink/15 text-ink-muted hover:border-azure-300 hover:bg-azure-50"
                  }`}
                >
                  {dept.name}
                </button>
              );
            })}
            {availableDepts.length === 0 && (
              <span className="text-xs text-ink-subtle">
                All departments already requested.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Instructions (optional)
            </label>
            <textarea
              className="input-field min-h-[50px] resize-y"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="e.g. Please provide all records relating to John Smith, employee ID 12345"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || selectedDepts.length === 0}
              className="pill-primary"
            >
              {saving
                ? "Creating..."
                : `Request from ${selectedDepts.length} dept${selectedDepts.length !== 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setSelectedDepts([]);
                setRequestNote("");
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
