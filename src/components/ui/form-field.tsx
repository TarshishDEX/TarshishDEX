import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Form field wrapper that combines label, input content, hint, and error
 * in a consistent vertical layout.
 */
export function FormField({ label, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="text-foreground-muted mb-1.5 block text-xs font-medium tracking-wider uppercase">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-danger mt-1.5 text-xs">{error}</p>
      ) : hint ? (
        <p className="text-foreground-faint mt-1.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
