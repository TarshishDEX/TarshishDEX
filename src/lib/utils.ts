import BigNumber from "bignumber.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a decimal number with thousands separators. */
export function formatNumber(value: number, maximumFractionDigits = 6): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

/** Format a compact number (e.g. 12.4K) for dashboard stats. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a price with adaptive precision. */
export function formatPrice(value: number): string {
  if (value === 0) return "0";
  if (value >= 1) return formatNumber(value, 4);
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 8 }).format(value);
}

/** Truncate a Stellar public key for display. */
export function truncateAddress(address: string, lead = 6, tail = 6): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/** Format a percentage with sign. */
export function formatPercent(value: number, signed = false): string {
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Normalize a token amount into its human-readable decimal form. */
export function normalizeAmount(rawAmount: string, decimals: number): string {
  const parsed = BigInt(rawAmount);
  const negative = parsed < 0n;
  const abs = negative ? -parsed : parsed;
  const integer = (abs / 10n ** BigInt(decimals)).toString();
  const fraction = (abs % 10n ** BigInt(decimals))
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${fraction ? `${integer}.${fraction}` : integer}`;
}

/**
 * Sanitize a swap amount input into a non-negative decimal string.
 *
 * Swap amounts flow into BigNumber math downstream, so the field must never
 * hold a leading minus sign (typed or pasted), a plus sign, or non-decimal
 * characters. Returns the cleaned string.
 */
export function sanitizeSwapAmount(raw: string): string {
  // Reject sign characters — negative amounts are never valid here.
  let sanitized = raw.replace(/[+-]/g, "");

  // Keep only digits and a single decimal point.
  sanitized = sanitized.replace(/[^0-9.]/g, "");
  const firstDot = sanitized.indexOf(".");
  if (firstDot !== -1) {
    sanitized = sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, "");
  }

  return sanitized;
}

/**
 * Format a decimal amount string to a fixed precision, trimming trailing
 * zeros (Stellar amounts use 7 decimal places). Normalizes raw strings such
 * as "0.0100000" to "0.01" and guards against non-finite input.
 */
export function formatAmount(value: string, decimals = 7): string {
  let n: BigNumber;
  try {
    n = new BigNumber(value);
  } catch {
    return "0";
  }
  if (!n.isFinite()) return "0";
  return n.toFixed(decimals).replace(/\.?0+$/, "");
}
