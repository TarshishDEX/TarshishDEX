/**
 * Functional try/catch that returns a [data, error] tuple.
 * Never throws — always returns one of the two values.
 */

export async function tryCatch<T>(fn: () => Promise<T>): Promise<[T, null] | [null, Error]> {
  try {
    return [await fn(), null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/** Synchronous version of tryCatch. */
export function tryCatchSync<T>(fn: () => T): [T, null] | [null, Error] {
  try {
    return [fn(), null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}
