/**
 * Lightweight runtime assertions for development and testing.
 * Stripped by bundlers in production when NODE_ENV=production.
 */

class AssertionError extends Error {
  constructor(message: string) {
    super(`Assertion failed: ${message}`);
    this.name = "AssertionError";
  }
}

/** Assert a condition is truthy. Throws in development, no-op in production. */
export function assert(condition: unknown, message: string): asserts condition {
  if (process.env.NODE_ENV !== "production" && !condition) {
    throw new AssertionError(message);
  }
}

/** Assert a value is not null or undefined. */
export function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  assert(value != null, message);
}

/** Assert a runtime invariant — always throws on failure, even in production. */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violation: ${message}`);
  }
}
