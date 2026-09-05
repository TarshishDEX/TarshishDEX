/**
 * Shared resilience helpers for Horizon calls.
 *
 * Horizon is a public service with aggressive rate limits (HTTP 429).
 * Every server route that talks to Horizon should route its calls through
 * `withHorizonResilience` so that:
 *
 * 1. Transient failures (429, 5xx, network errors) are retried with the
 *    existing exponential-backoff utility (`@/lib/utils/retry`).
 * 2. Rate-limit errors are distinguished from other failures via a typed
 *    `HorizonRateLimitError` carrying the server's `Retry-After` value.
 * 3. Sustained failures open a circuit breaker so we fail fast instead of
 *    hammering an already-unhealthy Horizon.
 */

import { withRetry } from "@/lib/utils/retry";
import { withCircuitBreaker } from "@/lib/server/circuit-breaker";

/** Default retry-after (seconds) used when Horizon omits the header. */
export const DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS = 5;

/**
 * Raised when a Horizon call is rejected with HTTP 429 after retries.
 * Carries the retry window so callers/UI can surface
 * "Horizon rate limit - retrying in X seconds".
 */
export class HorizonRateLimitError extends Error {
  readonly retryAfterSeconds: number;
  readonly status = 429;

  constructor(retryAfterSeconds = DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS) {
    super(`Horizon rate limited (429) — retry after ${retryAfterSeconds}s`);
    this.name = "HorizonRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Extract the HTTP status from any error that carries a response. */
export function getHorizonErrorStatus(error: unknown): number | null {
  if (error && typeof error === "object") {
    const status = (error as { response?: { status?: unknown } }).response?.status;
    if (typeof status === "number") return status;
  }
  return null;
}

/** True when the error is a Horizon HTTP 429 (rate limit). */
export function isHorizonRateLimitError(error: unknown): boolean {
  return getHorizonErrorStatus(error) === 429;
}

/**
 * Read the server-provided retry-after (seconds) from a 429 response,
 * falling back to a sensible default. Accepts both numeric and
 * HTTP-date header values.
 */
export function getHorizonRetryAfterSeconds(error: unknown): number {
  if (error && typeof error === "object") {
    const headers = (error as { response?: { headers?: unknown } }).response?.headers;
    if (headers && typeof headers === "object") {
      const raw = (headers as Record<string, unknown>)["retry-after"];
      if (typeof raw === "string") {
        const seconds = Number(raw);
        if (Number.isFinite(seconds) && seconds > 0) {
          return Math.ceil(seconds);
        }
        // HTTP-date format — compute the delta against now.
        const date = Date.parse(raw);
        if (!Number.isNaN(date)) {
          return Math.max(1, Math.ceil((date - Date.now()) / 1000));
        }
      }
    }
  }
  return DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS;
}

/**
 * Retry policy: retry rate limits, 5xx responses, and network-level
 * failures (status unknown), but never retry 4xx client errors.
 */
export function isTransientHorizonError(error: unknown): boolean {
  const status = getHorizonErrorStatus(error);
  if (status === null) {
    // No HTTP status — treat as a transport/network failure.
    return error instanceof Error || typeof error === "string";
  }
  return status === 429 || status >= 500;
}

export interface HorizonResilienceOptions {
  /** Additional attempts after the first call (default 2 → 3 total). */
  maxRetries?: number;
}

/**
 * Run a Horizon call with retry + circuit-breaker protection.
 *
 * - Transient failures are retried with exponential backoff.
 * - A final 429 is translated into `HorizonRateLimitError` so callers can
 *   distinguish rate limits from other failures and expose the retry window.
 * - After `threshold` consecutive failures the circuit opens and requests
 *   fail fast until the recovery timeout elapses.
 */
export async function withHorizonResilience<T>(
  name: string,
  fn: () => Promise<T>,
  options: HorizonResilienceOptions = {}
): Promise<T> {
  try {
    return await withCircuitBreaker(
      `horizon:${name}`,
      () =>
        withRetry(fn, {
          maxRetries: options.maxRetries ?? 2,
          shouldRetry: isTransientHorizonError,
        }),
      { threshold: 5, timeoutMs: 60_000 }
    );
  } catch (error) {
    if (isHorizonRateLimitError(error)) {
      throw new HorizonRateLimitError(getHorizonRetryAfterSeconds(error));
    }
    throw error;
  }
}
