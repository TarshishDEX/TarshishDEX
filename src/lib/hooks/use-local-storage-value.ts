"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Simple string localStorage value hook.
 * For primitive values (string) without JSON serialization overhead.
 */
export function useLocalStorageValue(
  key: string,
  initialValue = ""
): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) setValue(e.newValue);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  const update = useCallback(
    (v: string) => {
      setValue(v);
      try { localStorage.setItem(key, v); } catch { /* ignore */ }
    },
    [key]
  );

  const remove = useCallback(() => {
    setValue(initialValue);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }, [key, initialValue]);

  return [value, update, remove];
}
