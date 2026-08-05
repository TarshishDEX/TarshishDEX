import { cn } from "@/lib/utils";

interface ValidationSummaryProps {
  errors: string[];
  className?: string;
}

/**
 * Displays a list of validation errors in a grouped format.
 * Returns null when there are no errors.
 */
export function ValidationSummary({ errors, className }: ValidationSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div
      className={cn("bg-danger-soft border-danger/30 rounded-xl border px-4 py-3", className)}
      role="alert"
    >
      <p className="text-danger text-sm font-semibold">
        {errors.length} {errors.length === 1 ? "error" : "errors"} found:
      </p>
      <ul className="mt-1.5 list-inside list-disc space-y-0.5">
        {errors.map((error, i) => (
          <li key={i} className="text-danger/90 text-xs">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}
