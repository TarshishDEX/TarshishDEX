/**
 * Structured API error response shape used across all API routes.
 * Extends the base error with optional validation details and a unique
 * error ID for traceability in logs.
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

/** Map common HTTP statuses to an appropriate error code prefix. */
export function errorCode(status: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_ERROR";
    case 429:
      return "RATE_LIMITED";
    case 500:
      return "INTERNAL_ERROR";
    case 502:
      return "HORIZON_ERROR";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return "UNKNOWN";
  }
}

/**
 * Build a consistent JSON error response body with a unique error ID.
 */
export function buildErrorResponse(
  status: number,
  message: string,
  details?: ApiErrorResponse["details"]
): ApiErrorResponse {
  const errorId = crypto.randomUUID();
  return {
    error: message,
    code: errorCode(status),
    errorId,
    ...(details ? { details } : {}),
  };
}
