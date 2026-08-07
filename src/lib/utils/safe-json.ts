/**
 * Safe JSON parsing utilities.
 * Prevents runtime errors from malformed JSON inputs.
 */

/**
 * Parse a JSON string safely, returning a default value on failure.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Parse a JSON string and return the parsed value or null.
 */
export function tryJsonParse<T = unknown>(json: string): T | null {
  return safeJsonParse<T | null>(json, null);
}

/**
 * Stringify a value safely, returning "{}" on circular references
 * or other serialization failures.
 */
export function safeJsonStringify(value: unknown, fallback = "{}"): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}
