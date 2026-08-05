/**
 * Input sanitization helpers for API route parameters.
 * These provide defence-in-depth against injection attacks even though
 * Stellar addresses and asset codes have well-defined formats.
 */

const MAX_STRING_LENGTH = 200;

/** Strip control characters and enforce a reasonable max length. */
export function sanitizeString(input: string): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, "") // Strip control characters
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Strip zero-width chars
    .trim()
    .slice(0, MAX_STRING_LENGTH);
}

/** Validate that a string is safe for use in file paths or identifiers. */
export function isSafeIdentifier(input: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(input);
}

/** Ensure a numeric limit parameter is within reasonable bounds. */
export function clampLimit(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

/** Strip HTML tags from a string (basic XSS defence). */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Sanitize an object's string values recursively (shallow + one level deep). */
export function sanitizeParams<T extends Record<string, unknown>>(params: T): T {
  const result = { ...params };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "string") {
      result[key as keyof T] = stripHtml(sanitizeString(value)) as T[keyof T];
    }
  }
  return result;
}
