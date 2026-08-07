/**
 * Cursor-based pagination helpers.
 * More efficient than offset-based pagination for large datasets.
 */

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Paginate an array using cursor-based pagination.
 * Generates cursor strings from item IDs and returns the next page cursor.
 */
export function paginateWithCursor<T extends { id: string }>(
  items: T[],
  cursor: string | null,
  limit: number
): CursorPage<T> {
  const startIndex = cursor ? items.findIndex((item) => item.id === cursor) + 1 : 0;
  const page = items.slice(startIndex, startIndex + limit);
  return {
    items: page,
    nextCursor:
      page.length === limit && startIndex + limit < items.length ? page[page.length - 1].id : null,
    hasMore: startIndex + limit < items.length,
  };
}

/** Encode a cursor for URL-safe transport. */
export function encodeCursor(cursor: string): string {
  return Buffer.from(cursor).toString("base64url");
}

/** Decode a cursor from a URL parameter. */
export function decodeCursor(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf-8");
}
