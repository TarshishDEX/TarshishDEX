/**
 * API route body size limits applied via the Next.js route segment config.
 *
 * Import and spread into any API route that accepts request bodies.
 *
 * Usage in a route.ts:
 *   export const bodySizeLimit = API_BODY_LIMIT;
 *
 * Or directly:
 *   export const maxDuration = 15;
 *   export { bodyParser } from "next/dist/server/api-utils"; // not needed
 */

/** 1 MB — suitable for most JSON payloads. */
export const API_BODY_LIMIT_1MB = "1mb" as const;

/** 100 KB — suitable for lightweight payloads (preferences, etc.). */
export const API_BODY_LIMIT_100KB = "100kb" as const;

/**
 * Route segment config for API routes that accept request bodies.
 * Spread this into the route module's exports.
 *
 * Example:
 *   export { bodySizeLimit } from "@/lib/server/body-limit";
 *   // → sets bodyParser: { sizeLimit: '1mb' }
 */
export const bodySizeLimit = {
  bodyParser: {
    sizeLimit: API_BODY_LIMIT_1MB,
  },
} as const;
