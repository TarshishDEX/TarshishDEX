"use client";

import { useState, useLayoutEffect } from "react";

/**
 * Track whether the component is mounted.
 * Useful for preventing state updates after unmount and SSR guards.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount/unmount tracking
  useLayoutEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted;
}
