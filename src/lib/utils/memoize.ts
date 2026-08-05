/**
 * Simple memoization utilities.
 */

/** Memoize a single-argument function with a Map-based cache. */
export function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<T, R>();
  return (arg: T) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/** Memoize with a custom key resolver for multi-arg or complex cases. */
export function memoizeWith<T, R>(
  fn: (...args: T[]) => R,
  keyResolver: (...args: T[]) => string
): (...args: T[]) => R {
  const cache = new Map<string, R>();
  return (...args: T[]) => {
    const key = keyResolver(...args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/** Clear the memoization cache for a function (when arguments change meanings). */
export function createMemoized<T, R>(fn: (arg: T) => R, maxSize = 500) {
  const cache = new Map<T, R>();
  return {
    get: (arg: T) => {
      if (cache.has(arg)) return cache.get(arg)!;
      const result = fn(arg);
      if (cache.size >= maxSize) {
        const first = cache.keys().next().value;
        if (first !== undefined) cache.delete(first);
      }
      cache.set(arg, result);
      return result;
    },
    clear: () => cache.clear(),
  };
}
