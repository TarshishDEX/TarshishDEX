import { cn } from "@/lib/utils";

interface StatusMessageProps {
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  info: "border-primary/40 bg-primary-soft/60 text-primary",
  success: "border-success/40 bg-success-soft/60 text-success",
  warning: "border-warning/40 bg-warning-soft/60 text-warning",
  error: "border-danger/40 bg-danger-soft/60 text-danger",
};

/**
 * Color-coded status message bar for feedback (success, errors, warnings, info).
 */
export function StatusMessage({ message, variant = "info", className }: StatusMessageProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      {message}
    </div>
  );
}
