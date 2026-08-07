/**
 * Cache control header utilities.
 * Provides consistent cache policies for API responses.
 */

/** Cache-Control: no-store — for dynamic data that must be fresh every request. */
export const NO_CACHE = "no-store, must-revalidate";

/** Cache-Control: short-lived (5s) for frequently changing data like prices. */
export const SHORT_CACHE = "public, max-age=5, s-maxage=5, stale-while-revalidate=10";

/** Cache-Control: medium-lived (60s) for semi-static data like asset lists. */
export const MEDIUM_CACHE = "public, max-age=60, s-maxage=60, stale-while-revalidate=120";

/** Cache-Control: long-lived (1h) for static data like contract metadata. */
export const LONG_CACHE = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200";

/** ETag header name. */
export const ETAG_HEADER = "ETag";

/** If-None-Match header name for conditional requests. */
export const IF_NONE_MATCH = "If-None-Match";
