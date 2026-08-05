"use client";

import { useEffect, useRef } from "react";

/**
 * Run an effect exactly once on mount, even in React StrictMode
 * (which intentionally double-invokes effects in development).
 */
export function useEffectOnce(effect: () => void | (() => void)): void {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    return effect();
  }, [effect]);
}
