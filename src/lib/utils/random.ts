/**
 * Cryptographically secure random utilities.
 */

/**
 * Generate a random integer between min (inclusive) and max (exclusive).
 * Uses crypto.getRandomValues for cryptographic randomness.
 */
export function randomInt(min: number, max: number): number {
  const range = max - min;
  const maxSafe = Math.floor(2 ** 32 / range) * range;
  const buf = new Uint32Array(1);
  let rand: number;
  do {
    crypto.getRandomValues(buf);
    rand = buf[0];
  } while (rand >= maxSafe);
  return min + (rand % range);
}

/**
 * Generate a random ID string using crypto.randomUUID.
 * Falls back to a timestamp-based ID if crypto is unavailable.
 */
export function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * with cryptographically secure randomness.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
