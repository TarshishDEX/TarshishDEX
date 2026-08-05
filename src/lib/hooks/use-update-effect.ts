"use client";

import { useEffect, useRef } from "react";

/**
 * Like useEffect but skips the initial mount — only fires on dependency updates.
 * Equivalent to componentDidUpdate in class components.
 */
export function useUpdateEffect(effect: () => void | (() => void), deps: unknown[]): void {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    return effect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
