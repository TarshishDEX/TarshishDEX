/**
 * Throttle utility — limits function execution to once per interval.
 */

/**
 * Create a throttled version of a function.
 * The function is called at most once every `delayMs` milliseconds.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (elapsed >= delayMs) {
      lastCall = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = null;
        fn(...args);
      }, delayMs - elapsed);
    }
  };
}

/** Create a debounced version of a function. */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
