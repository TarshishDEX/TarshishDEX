"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Auto-refresh hook with toggle. Polls `callback` every `intervalMs`
 * when enabled. Returns the enabled state and a toggle function.
 */
export function useAutoRefresh(
  callback: () => void,
  intervalMs = 15_000,
  defaultEnabled = true
) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(callback, intervalMs);
    return () => clearInterval(id);
  }, [callback, intervalMs, enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { enabled, toggle, setEnabled };
}
