import { cn } from "@/lib/utils";

interface EmptyResultsProps {
  query?: string;
  className?: string;
  /** Emoji/icon shown above the title — defaults to the search magnifier. */
  icon?: string;
  /** Heading text — defaults to the search variant. */
  title?: string;
  /** Supporting message — defaults to the search-specific copy when query is set. */
  description?: string;
}

/**
 * Empty state placeholder with the shared icon + title + description layout.
 * Defaults match the original empty-search-results behavior, so existing
 * callers are unaffected while other empty states can reuse the same style.
 */
export function EmptyResults({
  query,
  className,
  icon = "🔍",
  title = "No results found",
  description,
}: EmptyResultsProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <span className="text-foreground-faint mb-3 text-3xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-foreground-muted mt-2 text-sm">{description}</p>
      ) : (
        query && (
          <p className="text-foreground-muted mt-2 text-sm">
            No matches for &ldquo;{query}&rdquo;. Try a different search term or clear the filters.
          </p>
        )
      )}
    </div>
  );
}
