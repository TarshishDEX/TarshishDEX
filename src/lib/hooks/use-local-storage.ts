"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Typed localStorage hook with SSR safety.
 * Returns [value, setValue, removeValue] — the value syncs to localStorage
 * automatically on change and hydrates from localStorage on mount.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Listen for changes from other tabs/windows
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage full or unavailable — silently ignore
        }
        return next;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
