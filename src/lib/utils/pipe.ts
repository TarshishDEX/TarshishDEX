/**
 * Functional pipe — compose functions left-to-right.
 * pipe(f, g, h)(x) === h(g(f(x)))
 */

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

/** Async version of pipe. */
export function pipeAsync<T>(...fns: Array<(arg: T) => T | Promise<T>>): (arg: T) => Promise<T> {
  return async (arg: T) => {
    let result = arg;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
}
