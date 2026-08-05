"use client";

import { useState, useCallback } from "react";

/**
 * Typed sessionStorage hook (data only persists for the tab session).
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const update = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = v instanceof Function ? v(prev) : v;
        try {
          sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
    },
    [key]
  );

  const remove = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore
    }
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, update, remove] as const;
}
