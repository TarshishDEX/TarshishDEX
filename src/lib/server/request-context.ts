import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
  requestId: string;
  startTime: number;
  path: string;
  method: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a callback within a request context.
 * The context is available to all downstream async operations
 * without passing it explicitly through function parameters.
 */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Get the current request context. Returns undefined outside a request. */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Get the current request ID for logging correlation. */
export function getRequestId(): string {
  return storage.getStore()?.requestId ?? "unknown";
}
