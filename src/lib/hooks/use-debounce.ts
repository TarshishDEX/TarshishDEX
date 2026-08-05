import { useEffect, useState, useRef } from "react";

/**
 * Debounce a rapidly-changing value. The debounced value only updates after
 * `delayMs` of inactivity — perfect for search inputs and range sliders.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delayMs]);

  return debounced;
}
