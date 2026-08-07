"use client";

import { useEffect, useRef, useCallback, useInsertionEffect } from "react";

/**
 * Declarative setInterval with pause/resume/clear.
 * The callback is always the latest version (no stale closures).
 */
export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);
  // Sync the latest callback in an insertion effect to avoid
  // reading/writing refs during render.
  useInsertionEffect(() => {
    savedCallback.current = callback;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (delayMs === null) {
      clear();
      return;
    }

    intervalRef.current = setInterval(() => savedCallback.current(), delayMs);
    return clear;
  }, [delayMs, clear]);

  return { clear };
}
