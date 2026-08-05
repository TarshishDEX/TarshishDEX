/**
 * Server-Timing header builder for exposing backend performance metrics
 * to the browser's Performance API. Chrome DevTools automatically parses
 * Server-Timing headers and shows them in the Network tab.
 */

interface TimingEntry {
  name: string;
  durationMs: number;
  description?: string;
}

/**
 * Build a Server-Timing header value from timing entries.
 * Format: "db;dur=45.3;desc=\"Database query\", cache;dur=2.1;desc=\"Cache lookup\""
 */
export function buildServerTiming(entries: TimingEntry[]): string {
  return entries
    .map((entry) => {
      let value = entry.name;
      value += `;dur=${entry.durationMs.toFixed(1)}`;
      if (entry.description) {
        value += `;desc="${entry.description.replace(/"/g, '\\"')}"`;
      }
      return value;
    })
    .join(", ");
}

/**
 * Measure the execution time of a function and add it to the timing entries.
 */
export async function measureTiming<T>(
  name: string,
  fn: () => Promise<T>,
  entries: TimingEntry[]
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    entries.push({
      name,
      durationMs: performance.now() - start,
    });
  }
}

/**
 * Create an empty timing entries array for collecting measurements.
 */
export function createTimings(): TimingEntry[] {
  return [];
}
