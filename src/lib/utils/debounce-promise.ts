/**
 * Debounce an async function — only the most recent call resolves.
 * Previous in-flight calls are cancelled via AbortController.
 */

export function debouncePromise<T, Args extends unknown[]>(
  fn: (signal: AbortSignal, ...args: Args) => Promise<T>,
  delayMs = 300
): (...args: Args) => Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;

  return (...args: Args) => {
    if (timeoutId) clearTimeout(timeoutId);
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(signal, ...args);
          if (!signal.aborted) resolve(result);
        } catch (error) {
          if (!signal.aborted) reject(error);
        }
      }, delayMs);
    });
  };
}
