// UK GDPR Article 12(3): respond without undue delay and in any event within
// one month of receipt of the request. We use 30 calendar days as the
// working approximation used by most DPOs.

export const SAR_DEADLINE_DAYS = 30;
export const SAR_EXTENSION_DAYS = 60; // +2 months for complex requests

export function calculateDueDate(received: Date): Date {
  const due = new Date(received);
  due.setDate(due.getDate() + SAR_DEADLINE_DAYS);
  return due;
}

export function calculateExtendedDueDate(received: Date): Date {
  const due = new Date(received);
  due.setDate(due.getDate() + SAR_DEADLINE_DAYS + SAR_EXTENSION_DAYS);
  return due;
}

export function daysUntilDue(dueDate: Date): number {
  const ms = dueDate.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function daysOverdue(dueDate: Date): number {
  const days = -daysUntilDue(dueDate);
  return Math.max(0, days);
}

export function formatUkDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function sarReference(id: string, received: Date): string {
  const year = received.getFullYear();
  const shortId = id.slice(0, 8).toUpperCase();
  return `SAR-${year}-${shortId}`;
}
