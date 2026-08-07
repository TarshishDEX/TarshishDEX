"use client";

import { useSyncExternalStore, useCallback } from "react";

/**
 * Track a CSS media query match state reactively.
 * Uses useSyncExternalStore which is the recommended primitive for
 * subscribing to external stores (like matchMedia) without calling
 * setState synchronously in an effect.
 *
 * Example: useMediaQuery("(min-width: 768px)") → true on tablet+ screens.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        const mql = window.matchMedia(query);
        mql.addEventListener("change", onStoreChange);
        return () => mql.removeEventListener("change", onStoreChange);
      },
      [query]
    ),
    () => window.matchMedia(query).matches,
    () => false
  );
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
