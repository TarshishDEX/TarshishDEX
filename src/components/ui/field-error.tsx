import { cn } from "@/lib/utils";

interface FieldErrorProps {
  error?: string;
  className?: string;
}

/**
 * Standard form field error message display.
 * Renders nothing when error is falsy.
 */
export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;
  return (
    <p className={cn("text-danger animate-fade-in mt-1.5 text-xs", className)} role="alert">
      {error}
    </p>
  );
}
