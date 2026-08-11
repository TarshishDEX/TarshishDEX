/**
 * Structured API error response shape used across all API routes.
 * Extends the base error with optional validation details and a unique
 * error ID for traceability in logs.
 *
 * Every error response follows this envelope — no route returns
 * flat `{ error: "..." }` strings. Clients can safely depend on
 * `code` and `errorId` being present on every 4xx/5xx response.
 */

export interface ApiErrorResponse {
  error: string;
  /** Machine-readable error code for client handling. */
  code: string;
  /** Unique error ID for correlation with server logs. */
  errorId: string;
  /** Optional validation error details (field-level). */
  details?: Array<{ field: string; message: string }>;
}

/**
 * Canonical error codes used across every API route.
 *
 * Each code maps to a specific failure mode — clients can switch on
 * these without parsing human-readable messages.  New routes add their
 * own domain-specific codes here so the full catalogue is visible in
 * one place.
 */
export const ErrorCode = {
  // ── Generic / transport-level ──────────────────────────────────────
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // ── Asset catalog ──────────────────────────────────────────────────
  ASSET_FETCH_FAILED: "ASSET_FETCH_FAILED",

  // ── Market data ────────────────────────────────────────────────────
  CANDLES_FETCH_FAILED: "CANDLES_FETCH_FAILED",
  ORDERBOOK_FETCH_FAILED: "ORDERBOOK_FETCH_FAILED",
  POOLS_FETCH_FAILED: "POOLS_FETCH_FAILED",
  STATS_FETCH_FAILED: "STATS_FETCH_FAILED",

  // ── Portfolio & trades ─────────────────────────────────────────────
  PORTFOLIO_FETCH_FAILED: "PORTFOLIO_FETCH_FAILED",
  TRADES_FETCH_FAILED: "TRADES_FETCH_FAILED",
  INVALID_STELLAR_ADDRESS: "INVALID_STELLAR_ADDRESS",

  // ── Swap ───────────────────────────────────────────────────────────
  SWAP_QUOTE_FAILED: "SWAP_QUOTE_FAILED",
  NO_VIABLE_ROUTE: "NO_VIABLE_ROUTE",

  // ── Orders (Soroban) ───────────────────────────────────────────────
  ORDERS_QUERY_FAILED: "ORDERS_QUERY_FAILED",
  ORDERS_BUILD_FAILED: "ORDERS_BUILD_FAILED",
  CONTRACT_NOT_DEPLOYED: "CONTRACT_NOT_DEPLOYED",

  // ── Legacy / HTTP-status fallback ──────────────────────────────────
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  HORIZON_ERROR: "HORIZON_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Build a consistent JSON error response body with a unique error ID.
 *
 * @param code  Domain-specific error code from `ErrorCode`.
 * @param status  HTTP status code.
 * @param message  Human-readable description.
 * @param details  Optional per-field validation details.
 */
export function buildErrorResponse(
  code: string,
  status: number,
  message: string,
  details?: ApiErrorResponse["details"],
): ApiErrorResponse {
  const errorId = crypto.randomUUID();
  return {
    error: message,
    code,
    errorId,
    ...(details ? { details } : {}),
  };
}
