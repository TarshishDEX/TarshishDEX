/**
 * Number formatting utilities for UI display.
 */

/**
 * Format a number with thousand separators and optional decimal places.
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage.
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Format a large number with abbreviations (K, M, B).
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with configurable significant digits.
 */
export function formatSignificant(value: number, sigDigits = 4): string {
  if (value === 0) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: sigDigits,
  }).format(value);
}
