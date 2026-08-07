const STELLAR_PUBLIC_KEY_LENGTH = 56;

/**
 * Stellar-specific formatting utilities.
 */

/** Format a Stellar public key for display: GABCD…WXYZ */
export function formatStellarAddress(address: string, prefix = 6, suffix = 6): string {
  if (address.length !== STELLAR_PUBLIC_KEY_LENGTH) return address;
  return `${address.slice(0, prefix)}…${address.slice(-suffix)}`;
}

/** Format a Stellar asset as "CODE" or "CODE:ISSUER_SHORT". */
export function formatAssetIdentifier(code: string, issuer?: string): string {
  if (!issuer) return code;
  return `${code}:${issuer.slice(0, 4)}…${issuer.slice(-4)}`;
}

/** Convert basis points to a percentage string. */
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/** Format XLM stroops to display units. */
export function stroopsToXlm(stroops: string | bigint): string {
  const s = typeof stroops === "string" ? BigInt(stroops) : stroops;
  const divisor = 10n ** 7n;
  const whole = s / divisor;
  const fraction = s % divisor;
  const fracStr = fraction.toString().padStart(7, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}
