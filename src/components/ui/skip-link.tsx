import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

/**
 * Skip-to-content link for keyboard navigation accessibility.
 * Visible on focus, hidden otherwise.
 */
export function SkipLink({ href = "#main-content", label = "Skip to main content", className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300]",
        "focus:bg-primary focus:text-white focus:rounded-xl focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg",
        className
      )}
    >
      {label}
    </a>
  );
}
