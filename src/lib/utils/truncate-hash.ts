/**
 * Hash truncation for display purposes.
 * Used for transaction hashes, account IDs, and other long hex/base32 strings.
 */

/**
 * Truncate a hash/address for display: "GABCD...WXYZ".
 */
export function truncateHash(hash: string, prefixLen = 4, suffixLen = 4): string {
  if (hash.length <= prefixLen + suffixLen + 3) return hash;
  return `${hash.slice(0, prefixLen)}…${hash.slice(-suffixLen)}`;
}

/** Truncate a Stellar account ID for compact display. */
export function truncateAccountId(id: string): string {
  return truncateHash(id, 6, 6);
}

/** Truncate a transaction hash for compact display. */
export function truncateTxHash(hash: string): string {
  return truncateHash(hash, 6, 4);
}
