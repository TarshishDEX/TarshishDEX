/**
 * Swap input validation utilities.
 * Ensures user inputs are safe before submitting transactions.
 */

/**
 * Validate a swap amount string.
 * Returns the parsed number or null if invalid.
 */
export function validateSwapAmount(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed === ".") return null;

  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) return null;

  // Prevent unreasonably large numbers
  if (num > 1e15) return null;

  return num;
}

/**
 * Validate a Stellar account ID format.
 * Basic format check — full validation requires Horizon lookup.
 */
export function isValidAccountId(id: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(id);
}

/**
 * Validate a Stellar asset code.
 */
export function isValidAssetCode(code: string): boolean {
  return /^[A-Za-z0-9]{1,12}$/.test(code);
}
