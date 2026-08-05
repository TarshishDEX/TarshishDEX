"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Track whether an element is being hovered.
 * Returns a ref to attach and the hover state.
 */
export function useHover<T extends HTMLElement = HTMLDivElement>() {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<T>(null);

  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  const attachRef = useCallback(
    (node: T | null) => {
      const prev = ref.current;
      if (prev) {
        prev.removeEventListener("mouseenter", onMouseEnter);
        prev.removeEventListener("mouseleave", onMouseLeave);
      }
      (ref as React.MutableRefObject<T | null>).current = node;
      if (node) {
        node.addEventListener("mouseenter", onMouseEnter);
        node.addEventListener("mouseleave", onMouseLeave);
      }
    },
    [onMouseEnter, onMouseLeave]
  );

  return { ref: attachRef, hovered };
}
