/** Horizon connection pool configuration. */

export const HORIZON_POOL_CONFIG = {
  maxConnections: 10,
  minConnections: 2,
  idleTimeoutMs: 30_000,
  acquireTimeoutMs: 10_000,
} as const;
