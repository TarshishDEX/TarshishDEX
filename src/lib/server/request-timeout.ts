/**
 * Race a promise against a timeout. If `fn` doesn't resolve within
 * `timeoutMs`, the returned promise rejects with a TimeoutError.
 * The underlying promise continues executing but its result is discarded.
 */

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Execute an async function with a deadline. Uses AbortSignal when
 * supported so the underlying operation can be cancelled.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();

  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
    // Unref the timer in Node.js so it doesn't keep the process alive
    if (typeof id === "object" && "unref" in id) {
      (id as unknown as NodeJS.Timeout).unref();
    }
  });

  try {
    return await Promise.race([fn(controller.signal), timeoutPromise]);
  } finally {
    controller.abort(); // Clean up in case fn resolves first
  }
}
