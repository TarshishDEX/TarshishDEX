import { NextResponse } from "next/server";

const DEFAULT_MAX_BODY_SIZE = 64 * 1024; // 64 KB — more than enough for our API

/**
 * Guard against oversized request bodies.
 * Reads and discards bodies that exceed `maxBytes`, returning a 413.
 * For GET/HEAD requests this is a no-op.
 */
export async function enforceBodyLimit(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_SIZE
): Promise<NextResponse | null> {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return null; // No body to check
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  // If no content-length, we could stream the body, but for our API
  // we only have GET routes, so this is a future-proof guard.
  return null;
}

/** Configurable max body size per route type. */
export const BODY_LIMITS = {
  DEFAULT: DEFAULT_MAX_BODY_SIZE,
  TRADING_PREFERENCES: 4 * 1024, // 4 KB — preferences are tiny
} as const;
