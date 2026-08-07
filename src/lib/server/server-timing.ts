/**
 * Server-Timing header builder.
 * Adds performance metrics to responses for debugging in browser DevTools.
 */

interface TimingEntry {
  name: string;
  duration: number;
  description?: string;
}

/**
 * Build a Server-Timing header value from timing entries.
 * Example: "db;dur=53, cache;dur=0;desc=HIT"
 */
export function buildServerTiming(...entries: TimingEntry[]): string {
  return entries
    .map((e) => {
      let value = `${e.name};dur=${Math.round(e.duration)}`;
      if (e.description) value += `;desc="${e.description}"`;
      return value;
    })
    .join(", ");
}

/** Measure the execution time of an async function. */
export async function measureTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; timing: TimingEntry }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, timing: { name, duration } };
}
