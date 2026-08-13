import { NextResponse } from "next/server";
import { buildErrorResponse, ErrorCode } from "@/lib/server/api-error";
import { logger } from "@/lib/server/logger";

/**
 * Wrap an API route handler with centralized error handling.
 * Catches unhandled exceptions and returns consistent 500 responses
 * with correlation IDs instead of raw Next.js error pages.
 *
 * Supports both plain routes and dynamic routes:
 *   // Plain route
 *   export const GET = apiHandler(async (request) => { ... });
 *   // Dynamic route with params
 *   export const GET = apiHandler(async (request, { params }) => { ... });
 */
export function apiHandler<T extends unknown[]>(
  handler: (request: Request, ...rest: T) => Promise<NextResponse>
): (request: Request, ...rest: T) => Promise<NextResponse> {
  return async (request: Request, ...rest: T) => {
    try {
      return await handler(request, ...rest);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      const requestId =
        request.headers.get("x-request-id") ??
        (typeof crypto !== "undefined" ? crypto.randomUUID() : "unknown");

      logger.error("unhandled API error", {
        error: message,
        requestId,
        path: new URL(request.url).pathname,
        stack: error instanceof Error ? error.stack : undefined,
      });

      const body = buildErrorResponse(ErrorCode.INTERNAL_ERROR, 500, "Internal server error");
      return NextResponse.json(body, {
        status: 500,
        headers: { "X-Request-Id": requestId },
      });
    }
  };
}
