"use client";

import { useState, useEffect } from "react";

/**
 * Returns `value` immediately, then resets to `resetValue` after `delayMs`.
 * Useful for "Copied!" feedback, temporary highlights, etc.
 */
export function useDelayedValue<T>(value: T, resetValue: T, delayMs = 2000): T {
  const [display, setDisplay] = useState(resetValue);

  useEffect(() => {
    if (value === resetValue) return;
    setDisplay(value);
    const timer = setTimeout(() => setDisplay(resetValue), delayMs);
    return () => clearTimeout(timer);
  }, [value, resetValue, delayMs]);

  return display;
}
