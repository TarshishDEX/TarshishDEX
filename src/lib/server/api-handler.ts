import { NextResponse } from "next/server";
import { buildErrorResponse } from "@/lib/server/api-error";
import { logger } from "@/lib/server/logger";

/**
 * Wrap an API route handler with centralized error handling.
 * Catches unhandled exceptions and returns consistent 500 responses
 * with correlation IDs instead of raw Next.js error pages.
 *
 * Usage:
 *   export const GET = apiHandler(async (request) => { ... });
 */
export function apiHandler(
  handler: (request: Request) => Promise<NextResponse>
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    try {
      return await handler(request);
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

      const body = buildErrorResponse(500, "Internal server error");
      return NextResponse.json(body, {
        status: 500,
        headers: { "X-Request-Id": requestId },
      });
    }
  };
}
