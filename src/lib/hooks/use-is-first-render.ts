"use client";

import { useState, useLayoutEffect } from "react";

/**
 * Returns true on the first render, false on subsequent renders.
 * Useful for skipping animations or effects on initial mount.
 */
export function useIsFirstRender(): boolean {
  const [isFirst, setIsFirst] = useState(true);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time state init
  useLayoutEffect(() => {
    setIsFirst(false);
  }, []);

  return isFirst;
}
