import { cn } from "@/lib/utils";

interface EmptyResultsProps {
  query?: string;
  className?: string;
}

/**
 * Empty search results placeholder — distinct from general empty states.
 */
export function EmptyResults({ query, className }: EmptyResultsProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <span className="text-foreground-faint mb-3 text-3xl" aria-hidden="true">🔍</span>
      <h3 className="font-display text-base font-semibold">No results found</h3>
      {query && (
        <p className="text-foreground-muted mt-2 text-sm">
          No matches for &ldquo;{query}&rdquo;. Try a different search term or clear the filters.
        </p>
      )}
    </div>
  );
}
