/**
 * Date formatting and manipulation utilities.
 */

/**
 * Format a Unix timestamp (ms) as a relative time string.
 * E.g. "2m ago", "3h ago", "yesterday", "Jan 15".
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return "yesterday";

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date as ISO 8601 for machine-readable contexts.
 */
export function formatISO(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/** Format a date for display: "Jan 15, 2026". */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
