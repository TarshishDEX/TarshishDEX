"use client";

import { useState, useEffect } from "react";

/**
 * Returns true once the component has mounted on the client.
 * Use to prevent hydration mismatches for components that depend
 * on browser APIs (localStorage, window, etc.).
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
