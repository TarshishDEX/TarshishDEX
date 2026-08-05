"use client";

import { useState, useEffect } from "react";

/**
 * Track the document visibility state.
 * Returns 'visible' when the tab is active, 'hidden' when backgrounded.
 * Useful for pausing data fetching when the user isn't looking.
 */
export function useDocumentVisibility(): DocumentVisibilityState {
  const [visibility, setVisibility] = useState<DocumentVisibilityState>(
    typeof document !== "undefined" ? document.visibilityState : "visible"
  );

  useEffect(() => {
    const handler = () => setVisibility(document.visibilityState);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visibility;
}
