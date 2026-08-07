/**
 * URL manipulation utilities for query parameter handling.
 */

/** Build a URL with query parameters from a Record. */
export function buildUrl(
  base: string,
  params: Record<string, string | number | undefined>
): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Parse query parameters from a URL string. */
export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URL(url).searchParams;
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

/** Join URL path segments safely, avoiding double slashes. */
export function joinPaths(...segments: string[]): string {
  return segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

/** Add a trailing slash to a URL if missing. */
export function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : url + "/";
}
