"use client";

import { useState } from "react";
import { Building2, Plus, Pencil, Trash2, Database } from "lucide-react";

interface Department {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string;
  dataTypes: string[];
  requestCount: number;
}

export function DepartmentRegistry({ initial }: { initial: Department[] }) {
  const [departments, setDepartments] = useState<Department[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [dataTypesRaw, setDataTypesRaw] = useState("");

  function resetForm() {
    setName("");
    setContactName("");
    setContactEmail("");
    setDataTypesRaw("");
    setShowForm(false);
    setEditing(null);
    setError(null);
  }

  function startEdit(dept: Department) {
    setEditing(dept.id);
    setName(dept.name);
    setContactName(dept.contactName ?? "");
    setContactEmail(dept.contactEmail);
    setDataTypesRaw(dept.dataTypes.join(", "));
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const dataTypes = dataTypesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editing) {
        const res = await fetch("/api/departments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing, name, contactName, contactEmail, dataTypes }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail ?? data.error);
        }
        const { department } = await res.json();
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === editing
              ? { ...d, name: department.name, contactName: department.contactName, contactEmail: department.contactEmail, dataTypes: JSON.parse(department.dataTypes) }
              : d
          )
        );
      } else {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, contactName, contactEmail, dataTypes }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail ?? data.error);
        }
        const { department } = await res.json();
        setDepartments((prev) => [
          ...prev,
          {
            id: department.id,
            name: department.name,
            contactName: department.contactName,
            contactEmail: department.contactEmail,
            dataTypes: JSON.parse(department.dataTypes),
            requestCount: 0,
          },
        ]);
      }
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this department? Existing data requests won't be deleted.")) return;

    const res = await fetch("/api/departments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      {/* Department list */}
      {departments.length === 0 && !showForm && (
        <div className="card text-center py-16">
          <div className="text-ink-subtle text-sm">
            No departments registered yet.
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            Add departments that hold personal data — HR, IT, Finance, etc.
          </p>
          <Building2 size={28} strokeWidth={1.5} className="mx-auto mb-3 text-ink-subtle" />
          <button
            onClick={() => setShowForm(true)}
            className="pill-primary mt-6 inline-flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add first department
          </button>
        </div>
      )}

      {departments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div key={dept.id} className="card group relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{dept.name}</h3>
                  {dept.contactName && (
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {dept.contactName}
                    </div>
                  )}
                  <div className="mt-0.5 text-xs text-azure-600">
                    {dept.contactEmail}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(dept)}
                    className="flex items-center gap-0.5 text-[11px] text-ink-subtle hover:text-azure-600 px-1.5 py-0.5 rounded hover:bg-azure-50"
                  >
                    <Pencil size={10} strokeWidth={2} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="flex items-center gap-0.5 text-[11px] text-ink-subtle hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50"
                  >
                    <Trash2 size={10} strokeWidth={2} />
                    Remove
                  </button>
                </div>
              </div>

              {dept.dataTypes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dept.dataTypes.map((dt) => (
                    <span key={dt} className="tag text-[10px]">
                      {dt}
                    </span>
                  ))}
                </div>
              )}

              {dept.requestCount > 0 && (
                <div className="mt-3 flex items-center gap-1 text-[10px] text-ink-subtle">
                  <Database size={9} strokeWidth={2} />
                  {dept.requestCount} data request{dept.requestCount !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}

          {/* Add button as a card */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="card flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/10 hover:border-azure-300 hover:bg-azure-50/30 transition-colors min-h-[120px]"
            >
              <Plus size={18} strokeWidth={1.5} className="text-ink-subtle" />
              <span className="text-sm text-ink-subtle">Add department</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="stat-label">
            {editing ? "Edit department" : "New department"}
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Department name
              </label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Human Resources"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Contact email
              </label>
              <input
                className="input-field"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hr@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Contact name (optional)
              </label>
              <input
                className="input-field"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Data types held (comma-separated)
              </label>
              <input
                className="input-field"
                value={dataTypesRaw}
                onChange={(e) => setDataTypesRaw(e.target.value)}
                placeholder="personnel files, disciplinary records, payroll"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="pill-primary"
            >
              {saving ? "Saving..." : editing ? "Update" : "Add department"}
            </button>
            <button
              type="button"
              onClick={resetForm}
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
