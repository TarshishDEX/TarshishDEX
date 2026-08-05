"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";

const NAV_ITEMS = [
  { href: "/swap", label: "Swap", icon: "⇄" },
  { href: "/markets", label: "Markets", icon: "◈" },
  { href: "/portfolio", label: "Portfolio", icon: "◉" },
  { href: "/assets", label: "Assets", icon: "▥" },
  { href: "/analytics", label: "Analytics", icon: "{}" },
];

/**
 * Mobile slide-out navigation drawer. Toggled by a hamburger icon.
 * Closes on route change, escape key, or backdrop click.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-surface hover:border-border-strong flex h-9 w-9 items-center justify-center rounded-lg border transition-colors md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border shadow-2xl md:hidden",
          "transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-base font-semibold tracking-tight">
            Tarshish<span className="text-gradient">DEX</span>
          </span>
        </div>

        <nav className="p-3" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-foreground"
                    : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <p className="text-foreground-faint text-xs text-center">
            Built on Stellar · Testnet
          </p>
        </div>
      </div>
    </>
  );
}
