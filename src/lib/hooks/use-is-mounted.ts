"use client";

import { useEffect, useRef } from "react";

/**
 * Track whether the component is mounted.
 * Useful for preventing state updates after unmount and SSR guards.
 */
export function useIsMounted(): boolean {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return mounted.current;
}
