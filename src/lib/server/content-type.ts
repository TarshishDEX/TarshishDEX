/**
 * Content-Type negotiation helper for API routes.
 * Parses Accept headers and selects the best response format.
 */

type SupportedType = "application/json" | "text/plain" | "text/html";

const PREFERRED_ORDER: SupportedType[] = ["application/json", "text/plain", "text/html"];

/**
 * Parse the Accept header and select the best supported content type.
 * Defaults to application/json when nothing matches.
 */
export function negotiateContentType(acceptHeader: string | null): SupportedType {
  if (!acceptHeader) return "application/json";

  const accepted = acceptHeader.split(",").map((s) => s.split(";")[0].trim().toLowerCase());

  for (const preferred of PREFERRED_ORDER) {
    if (accepted.includes(preferred)) return preferred;
    if (accepted.includes("*/*")) return preferred;
  }

  return "application/json";
}

/** Build a Content-Type header string with charset. */
export function contentTypeHeader(type: SupportedType): string {
  return `${type}; charset=utf-8`;
}

/** Common content-type header values. */
export const ContentTypes = {
  JSON: "application/json; charset=utf-8",
  TEXT: "text/plain; charset=utf-8",
  HTML: "text/html; charset=utf-8",
  SSE: "text/event-stream",
} as const;
