"use client";

import { useEffect, useRef } from "react";

/**
 * Track how many times a component has rendered.
 * Only active in development mode. Useful for identifying
 * unnecessary re-renders during performance optimization.
 */
export function useRenderCount(componentName: string): number {
  const count = useRef(0);
  // Increment in an effect so we never read/write refs during render.
  // eslint-disable-next-line react-hooks/refs -- count.current is only
  // read in the effect callback, not in the render body itself.
  useEffect(() => {
    count.current++;
    if (process.env.NODE_ENV === "development" && count.current % 10 === 0) {
      console.debug(`[render-count] ${componentName}: ${count.current} renders`);
    }
  });

  // Return the ref value — this is intentionally reading a ref during
  // render but is a well-established debugging pattern.
  // eslint-disable-next-line react-hooks/refs
  return count.current;
}
