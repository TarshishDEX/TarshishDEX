import { NextResponse } from "next/server";

/**
 * Standard OPTIONS handler for CORS preflight requests.
 * Export this from any API route that needs CORS support.
 *
 * Usage in a route.ts:
 *   export { OPTIONS } from "@/lib/api/cors";
 */
export function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Request-Id, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
