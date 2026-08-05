"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Declarative setTimeout with auto-cleanup and reset.
 * The callback is always the latest version.
 */
export function useTimeout(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clear();
    if (delayMs !== null) {
      timeoutRef.current = setTimeout(() => savedCallback.current(), delayMs);
    }
  }, [clear, delayMs]);

  useEffect(() => {
    reset();
    return clear;
  }, [reset, clear]);

  return { clear, reset };
}
