"use client";

import { useState, useEffect } from "react";

/**
 * Debounce a rapidly changing value.
 * Returns the debounced value after `delayMs` of inactivity.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
