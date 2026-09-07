"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/** Routes shown in the persistent bottom bar (primary destinations). */
const PRIMARY_ITEMS: BottomNavItem[] = [
  {
    href: "/swap",
    label: "Swap",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/markets",
    label: "Markets",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l6.5 3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/assets",
    label: "Assets",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 3l8 5v8l-8 5-8-5V8l8-5z" strokeLinejoin="round" />
        <path d="M4.5 8L12 12.5 19.5 8M12 12.5V21" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/** Routes surfaced by the "More" sheet (secondary destinations). */
const MORE_ITEMS: BottomNavItem[] = [
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="3" y="9" width="4" height="12" rx="1" />
        <rect x="10" y="4" width="4" height="17" rx="1" />
        <rect x="17" y="13" width="4" height="8" rx="1" />
      </svg>
    ),
  },
  {
    href: "/orders",
    label: "Orders",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      </svg>
    ),
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Persistent bottom navigation for small screens (< 768px). Provides thumb-
 * reachable icons + labels for the primary destinations plus a "More" sheet
 * for secondary routes. Hidden on md+ where the desktop header nav takes over.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close the "More" sheet on route change.
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (pathname !== previousPathname.current) {
      previousPathname.current = pathname;
      setMoreOpen(false);
    }
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close when clicking outside the sheet.
  useEffect(() => {
    if (!moreOpen) return;
    function onClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  const moreActive = MORE_ITEMS.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      {/* "More" sheet */}
      {moreOpen && (
        <div
          ref={sheetRef}
          className="animate-fade-in-up border-border bg-surface fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-md rounded-2xl border p-2 shadow-2xl md:hidden"
          role="menu"
          aria-label="More navigation"
        >
          {MORE_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-foreground"
                    : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Bottom navigation"
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-5">
          {PRIMARY_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-foreground-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              moreOpen || moreActive
                ? "text-primary"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
            </svg>
            More
          </button>
        </div>
      </nav>
    </>
  );
}
