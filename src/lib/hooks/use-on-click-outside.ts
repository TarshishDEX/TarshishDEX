"use client";

import { useEffect, type RefObject } from "react";

/**
 * Fire a callback when the user clicks or touches outside a given element.
 * Standard pattern for dropdowns, modals, and popovers.
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    function listener(event: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    }

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]);
}
