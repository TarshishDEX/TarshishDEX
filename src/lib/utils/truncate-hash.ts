/**
 * Transaction hash formatting utilities.
 */

/** Truncate a tx hash for display: 0xabcd…1234 */
export function truncateHash(hash: string, prefix = 6, suffix = 4): string {
  if (hash.length <= prefix + suffix + 1) return hash;
  return `${hash.slice(0, prefix)}…${hash.slice(-suffix)}`;
}

/** Format a tx hash as an explorer-friendly short reference. */
export function shortTxRef(hash: string): string {
  return hash.slice(0, 8);
}

/** Check if a string looks like a Stellar transaction hash (64 hex chars). */
export function isTxHash(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value);
}
