/**
 * Request timeout configuration and helpers.
 * Prevents hanging API requests from consuming resources indefinitely.
 */

/** Default timeout for API requests (10 seconds). */
export const DEFAULT_API_TIMEOUT_MS = 10_000;

/** Timeout for Soroban RPC calls (30 seconds — contract calls can be slow). */
export const SOROBAN_RPC_TIMEOUT_MS = 30_000;

/** Timeout for Horizon API calls (15 seconds). */
export const HORIZON_TIMEOUT_MS = 15_000;

/**
 * Create an AbortSignal that fires after a given timeout.
 * Use with fetch() to cancel slow network requests.
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/**
 * Race a promise against a timeout — rejects with a timeout error
 * if the promise doesn't resolve within the specified duration.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Request timed out"
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
