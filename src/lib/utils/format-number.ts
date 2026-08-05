/**
 * Extended number formatting utilities.
 * Adds relative-change, abbreviated, and asset-specific formatters.
 */

/** Format a number as relative change with direction indicator. */
export function formatRelativeChange(current: number, previous: number): string {
  if (previous === 0) return current >= 0 ? "+∞" : "-∞";
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/** Abbreviate large numbers with SI suffixes (K, M, B). */
export function formatAbbreviated(value: number, decimals = 1): string {
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return value.toFixed(decimals);
}

/** Format a raw Stellar stroop amount to display units. */
export function formatStroops(stroops: string): string {
  const num = BigInt(stroops);
  const divisor = 10n ** 7n;
  const whole = num / divisor;
  const fraction = num % divisor;
  const fracStr = fraction.toString().padStart(7, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

/** Format a duration in milliseconds to human-readable form. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}
