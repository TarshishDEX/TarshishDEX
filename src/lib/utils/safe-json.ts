/**
 * Safe JSON operations that never throw.
 */

/** Parse JSON safely, returning undefined on failure instead of throwing. */
export function safeJsonParse<T = unknown>(json: string): T | undefined {
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

/** Stringify to JSON safely with a fallback value. */
export function safeJsonStringify(value: unknown, fallback = "{}"): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

/** Parse with a default value on failure. */
export function safeJsonParseWithDefault<T>(json: string, defaultValue: T): T {
  return safeJsonParse<T>(json) ?? defaultValue;
}
