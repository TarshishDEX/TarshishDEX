import { NextResponse } from "next/server";

/**
 * Standardized API response envelope.
 * Every response wraps its payload in { ok, data? } or { ok, error, code? }
 * so clients have a predictable shape to parse.
 */

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Wrap a successful payload in the standard envelope. */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Return a structured error with an optional machine-readable code. */
export function apiError(error: string, status = 400, code?: string): NextResponse<ApiError> {
  return NextResponse.json({ ok: false, error, ...(code ? { code } : {}) }, { status });
}

/** Error codes for consistent client-side handling. */
export const ErrorCode = {
  VALIDATION: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  UPSTREAM_FAILURE: "UPSTREAM_FAILURE",
  INTERNAL: "INTERNAL_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;
