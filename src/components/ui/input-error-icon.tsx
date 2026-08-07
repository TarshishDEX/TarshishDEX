import { cn } from "@/lib/utils";

interface InputErrorIconProps {
  hasError: boolean;
  className?: string;
}

/**
 * Small icon shown inside or beside form fields to indicate validation status.
 */
export function InputErrorIcon({ hasError, className }: InputErrorIconProps) {
  if (!hasError) return null;

  return (
    <span className={cn("text-danger flex shrink-0 items-center", className)} aria-hidden="true">
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}
