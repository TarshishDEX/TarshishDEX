"use client";

import { useRef } from "react";

/**
 * Track how many times a component has rendered.
 * Only active in development mode. Useful for identifying
 * unnecessary re-renders during performance optimization.
 */
export function useRenderCount(componentName: string): number {
  const count = useRef(0);

  if (process.env.NODE_ENV === "development") {
    count.current++;
    // Log on every 10th render to avoid noise
    if (count.current % 10 === 0) {
      console.debug(`[render-count] ${componentName}: ${count.current} renders`);
    }
  }

  return count.current;
}
