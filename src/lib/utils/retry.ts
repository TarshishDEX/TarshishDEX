/**
 * Retry an async function with exponential backoff and jitter.
 * Ideal for transient Horizon / Soroban RPC failures.
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Optional predicate – only retry when it returns true. */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 400,
  maxDelayMs: 10_000,
  shouldRetry: () => true,
};

/**
 * Call `fn` up to `maxRetries + 1` times. Delays between attempts follow
 * exponential backoff: `min(maxDelay, baseDelay * 2^attempt)` with ±25% jitter.
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs, shouldRetry } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !shouldRetry(error)) throw error;

      const baseDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = baseDelay * (0.5 + Math.random() * 0.5); // 0.5x–1.0x
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }

  throw lastError;
}
