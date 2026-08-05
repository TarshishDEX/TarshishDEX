import { AsyncLocalStorage } from "async_hooks";

interface RequestContext {
  requestId: string;
  startTime: number;
  path: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Per-request context using AsyncLocalStorage.
 * Propagates request ID and timing through the entire async call chain
 * without passing props through every function.
 */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Get the current request ID or fallback. */
export function getRequestId(): string {
  return getRequestContext()?.requestId ?? "unknown";
}

/** Measure elapsed time since the request started. */
export function getElapsedMs(): number {
  const ctx = getRequestContext();
  return ctx ? Date.now() - ctx.startTime : 0;
}
