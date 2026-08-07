import { type NextRequest } from "next/server";

/**
 * API-level CORS configuration.
 * Used by individual route handlers for fine-grained CORS control.
 */

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://tarshishdex.com",
  "https://www.tarshishdex.com",
];

export function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // In development, allow all origins
  if (process.env.NODE_ENV === "development") {
    return origin ?? "*";
  }
  return ALLOWED_ORIGINS[0];
}

export { ALLOWED_ORIGINS };
