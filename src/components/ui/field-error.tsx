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
    <p className={cn("text-danger mt-1.5 text-xs animate-fade-in", className)} role="alert">
      {error}
    </p>
  );
}
