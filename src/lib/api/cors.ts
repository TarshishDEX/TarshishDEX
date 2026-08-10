import { NextResponse, type NextRequest } from "next/server";

/** API-level CORS configuration. */

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://tarshishdex.com",
  "https://www.tarshishdex.com",
];

export function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  if (process.env.NODE_ENV === "development") return origin ?? "*";
  return ALLOWED_ORIGINS[0]!;
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Request-Id, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export { ALLOWED_ORIGINS };
