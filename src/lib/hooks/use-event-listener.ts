"use client";

import { useEffect, useRef, useInsertionEffect } from "react";

/**
 * Type-safe event listener hook with automatic cleanup.
 * Supports window, document, and element targets.
 * Uses useInsertionEffect to sync the callback ref before DOM mutations,
 * avoiding the ref-during-render ESLint error.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement | null,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): void {
  const savedListener = useRef(listener);
  // Sync the latest callback in an insertion effect (runs before layout effects,
  // after DOM mutations), which avoids reading/writing refs during render.
  useInsertionEffect(() => {
    savedListener.current = listener;
  });

  useEffect(() => {
    if (!target) return;
    const handler = (event: Event) => savedListener.current(event as WindowEventMap[K]);
    target.addEventListener(type as string, handler, options);
    return () => target.removeEventListener(type as string, handler, options);
  }, [target, type, options]);
}
