/**
 * Input sanitization utilities.
 * Prevents XSS and injection attacks by sanitizing user-supplied values.
 */

/** Characters that are safe for Stellar asset codes and account IDs. */
const STELLAR_SAFE_PATTERN = /^[A-Za-z0-9:_-]+$/;

/**
 * Sanitize a string by removing HTML tags and dangerous characters.
 * Returns an empty string for null/undefined inputs.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>"'&]/g, "") // Remove dangerous characters
    .trim();
}

/**
 * Validate that a string contains only Stellar-safe characters.
 * Used for asset codes, account IDs, and other on-chain identifiers.
 */
export function isValidStellarIdentifier(value: string): boolean {
  return STELLAR_SAFE_PATTERN.test(value) && value.length <= 128;
}

/**
 * Sanitize a numeric string — returns the number or throws if invalid.
 */
export function parseNumericParam(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

/** Limit string length to prevent DoS via oversized inputs. */
export function truncateString(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}
