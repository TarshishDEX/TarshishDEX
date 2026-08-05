import { cn } from "@/lib/utils";
import { RetryButton } from "@/components/ui/retry-button";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standard error display with optional retry button.
 */
export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <div
      className={cn("bg-danger-soft border-danger/30 rounded-xl border px-4 py-3", className)}
      role="alert"
    >
      <p className="text-danger text-sm font-medium">{message}</p>
      {onRetry && (
        <div className="mt-2">
          <RetryButton onRetry={onRetry} label="Try again" />
        </div>
      )}
    </div>
  );
}
