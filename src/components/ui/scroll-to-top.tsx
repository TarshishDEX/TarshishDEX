"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating scroll-to-top button. Appears after scrolling down 400px,
 * smoothly scrolls the viewport to the top on click.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-xl",
        "bg-surface-elevated border border-border shadow-lg",
        "text-foreground-muted hover:text-foreground hover:border-border-strong",
        "transition-all duration-200 animate-fade-in-up",
      )}
    >
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10 16V4m0 0L5 9m5-5l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
