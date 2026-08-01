import { parseAssetString } from "@/lib/stellar/asset";
import { isValidPublicKey } from "@/lib/stellar/account";
import type { StellarAsset } from "@/lib/stellar/types";

/** Parse a "CODE:ISSUER" or "XLM" asset param, or null when invalid. */
export function parseAssetParam(value: string | null | undefined): StellarAsset | null {
  if (!value) return null;
  return parseAssetString(value);
}

/** Parse and validate a Stellar public key, or null when invalid. */
export function parseAddress(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return isValidPublicKey(trimmed) ? trimmed : null;
}

/** Parse a bounded positive integer param (e.g. limit), falling back when invalid. */
export function parseLimit(
  value: string | null | undefined,
  fallback: number,
  max: number
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

/** Parse a slippage percentage in [0.1, 50], falling back when invalid. */
export function parseSlippage(value: string | null | undefined, fallback = 1): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0.1 || parsed > 50) return fallback;
  return parsed;
}

/** Parse a positive decimal amount string, or null when invalid. */
export function parseAmount(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return trimmed;
}

/** Parse a duration in milliseconds (bounded), falling back when invalid. */
export function parseDurationMs(
  value: string | null | undefined,
  fallback: number,
  max: number
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}
