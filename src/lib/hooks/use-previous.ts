"use client";

import { useState, useLayoutEffect } from "react";

/**
 * Track the previous value of a state or prop across renders.
 * Returns undefined on the first render.
 */
export function usePrevious<T>(value: T): T | undefined {
  const [prev, setPrev] = useState<T | undefined>(undefined);

  useLayoutEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setPrev(value);
  }, [value]);

  return prev;
}
