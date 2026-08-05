/**
 * Client-side swap input validation helpers.
 * Validate amounts before they hit the routing engine to prevent obviously
 * malformed inputs and give the user clear feedback.
 */

const MAX_DECIMALS = 7; // Stellar's 7-decimal precision
const MAX_AMOUNT = 9_999_999_999; // ~10B — prevents absurd inputs

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a raw swap amount string. Rejects:
 * - Empty strings
 * - Non-numeric content (except decimal point)
 * - Negative or zero values
 * - More than 7 decimal places (Stellar precision)
 * - Values exceeding 10 billion (guard against overflow)
 */
export function validateSwapAmount(raw: string): ValidationResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { valid: false, error: "Enter an amount" };
  }

  if (!/^\d*\.?\d*$/.test(trimmed)) {
    return { valid: false, error: "Only numbers are allowed" };
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return { valid: false, error: "Invalid number" };
  }

  if (num <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (trimmed.includes(".")) {
    const decimals = trimmed.split(".")[1].length;
    if (decimals > MAX_DECIMALS) {
      return { valid: false, error: `Maximum ${MAX_DECIMALS} decimal places` };
    }
  }

  if (num > MAX_AMOUNT) {
    return { valid: false, error: "Amount too large" };
  }

  return { valid: true };
}

/**
 * Check if a swap amount exceeds the user's available balance.
 */
export function exceedsBalance(amount: string, balance: string | null): boolean {
  if (!balance) return false;
  return Number(amount) > Number(balance);
}

/**
 * Compute the maximum input decimals allowed from the raw string.
 * Returns the count of decimal places, capped at 7.
 */
export function maxDecimalsFromString(raw: string): number {
  if (!raw.includes(".")) return 0;
  return Math.min(raw.split(".")[1].length, MAX_DECIMALS);
}
