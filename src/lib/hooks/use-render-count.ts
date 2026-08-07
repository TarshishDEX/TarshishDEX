"use client";

import { useRef, useEffect } from "react";

/**
 * Track how many times a component has rendered.
 * Only active in development mode. Useful for identifying
 * unnecessary re-renders during performance optimization.
 */
export function useRenderCount(componentName: string): number {
  const count = useRef(0);

  useEffect(() => {
    count.current++;
    if (process.env.NODE_ENV === "development" && count.current % 10 === 0) {
      console.debug(`[render-count] ${componentName}: ${count.current} renders`);
    }
  });

  /* eslint-disable-next-line react-hooks/refs */
  return count.current;
}
