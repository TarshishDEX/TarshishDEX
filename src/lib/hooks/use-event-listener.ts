"use client";

import { useEffect, useRef } from "react";

/**
 * Type-safe event listener hook with automatic cleanup.
 * Supports window, document, and element targets.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement | null,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): void {
  const savedListener = useRef(listener);
  savedListener.current = listener;

  useEffect(() => {
    if (!target) return;
    const handler = (event: Event) => savedListener.current(event as WindowEventMap[K]);
    target.addEventListener(type as string, handler, options);
    return () => target.removeEventListener(type as string, handler, options);
  }, [target, type, options]);
}
