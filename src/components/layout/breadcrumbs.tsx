"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PATH_LABELS: Record<string, string> = {
  swap: "Swap",
  markets: "Markets",
  portfolio: "Portfolio",
  assets: "Assets",
  analytics: "Analytics",
};

/**
 * Breadcrumb navigation derived from the current route path.
 * Shows on all pages except the home page.
 */
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumbs" className={cn("flex items-center gap-1.5 text-sm", className)}>
      <Link
        href="/"
        className="text-foreground-muted hover:text-foreground transition-colors"
      >
        Home
      </Link>
      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        const label = PATH_LABELS[segment] ?? segment;

        return (
          <span key={href} className="flex items-center gap-1.5">
            <span className="text-foreground-faint" aria-hidden="true">
              /
            </span>
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
