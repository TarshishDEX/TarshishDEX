/**
 * Cursor-based pagination helpers for API list endpoints.
 * Horizon uses cursor-based pagination (not offset), so we expose
 * the same pattern to API consumers.
 */

export interface PaginationMeta {
  cursor?: string;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Build a paginated response from a list of items.
 * Extracts the next cursor from the last item's ID (assumes Horizon-style IDs).
 */
export function buildPaginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;

  return {
    items: sliced,
    pagination: {
      cursor: sliced[0]?.id,
      limit,
      hasMore,
      nextCursor: hasMore ? sliced[sliced.length - 1]?.id : undefined,
    },
  };
}

/**
 * Encode a pagination cursor for URL-safe transport.
 * Simple base64url encoding with no external deps.
 */
export function encodeCursor(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export function decodeCursor(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf-8");
}
