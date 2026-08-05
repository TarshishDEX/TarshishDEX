/**
 * Array manipulation utilities.
 */

/** Split an array into chunks of the given size. */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/** Remove duplicate values from an array. */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/** Group array elements by a key function. */
export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/** Create a range array [start, end) with optional step. */
export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) result.push(i);
  return result;
}

/** Get the last element of an array safely. */
export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}
