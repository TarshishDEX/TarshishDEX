"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns true once the component has mounted on the client.
 * Uses useSyncExternalStore instead of useState + useEffect to avoid
 * calling setState synchronously inside an effect body.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
