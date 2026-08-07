"use client";

import { useState, useEffect } from "react";
import { throttle } from "@/lib/utils/throttle";

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Track window dimensions reactively with throttled resize handling.
 * Returns { width: 0, height: 0 } during SSR.
 */
export function useWindowSize(throttleMs = 150): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const handler = throttle(() => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }, throttleMs);

    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      // resize observer cleanup;
    };
  }, [throttleMs]);

  return size;
}
