"use client";

import { useState, useEffect } from "react";

/**
 * Track a CSS media query match state reactively.
 * Example: useMediaQuery("(min-width: 768px)") → true on tablet+ screens.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }
    mql.addEventListener("change", handleChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

/** Pre-built breakpoint helpers. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
