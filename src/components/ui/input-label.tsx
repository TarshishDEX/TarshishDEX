import { cn } from "@/lib/utils";

interface InputLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

/**
 * Standard form input label with optional required indicator.
 */
export function InputLabel({ htmlFor, children, required, className }: InputLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-foreground-muted mb-1.5 block text-xs font-medium tracking-wider uppercase", className)}
    >
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}
