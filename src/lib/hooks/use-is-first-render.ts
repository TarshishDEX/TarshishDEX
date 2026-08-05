"use client";

import { useRef, useEffect } from "react";

/**
 * Returns true on the first render, false on subsequent renders.
 * Useful for skipping animations or effects on initial mount.
 */
export function useIsFirstRender(): boolean {
  const isFirst = useRef(true);

  useEffect(() => {
    isFirst.current = false;
  }, []);

  return isFirst.current;
}
