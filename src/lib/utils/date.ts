/**
 * Date formatting utilities.
 */

/** Format a date as a relative time string ("2 hours ago", "just now", etc.). */
export function relativeTime(date: Date | number | string): string {
  const now = Date.now();
  const then = typeof date === "number" ? date : new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

/** Format a date as ISO 8601 with timezone offset. */
export function toISO(date: Date | number): string {
  return new Date(date).toISOString();
}

/** Format a date as a human-readable short form (e.g. "Jan 15, 2024"). */
export function formatDateShort(date: Date | number | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a date as time only (HH:MM). */
export function formatTimeOnly(date: Date | number | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Check if a date is today. */
export function isToday(date: Date | number): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
