"use client";

import { useState, useEffect } from "react";

/**
 * Track whether the browser window/tab has focus.
 * Useful for pausing auto-refresh or animations when the user is away.
 */
export function useWindowFocus(): boolean {
  const [focused, setFocused] = useState(
    typeof document !== "undefined" ? document.hasFocus() : true
  );

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return focused;
}
