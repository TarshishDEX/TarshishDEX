"use client";

import { useEffect, useRef } from "react";

/**
 * Debug hook that logs which props changed between renders.
 * Only active in development. Useful for tracking down unnecessary re-renders.
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, unknown>): void {
  const previousProps = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (previousProps.current) {
      const changed: Record<string, [unknown, unknown]> = {};
      const allKeys = new Set([...Object.keys(previousProps.current), ...Object.keys(props)]);

      for (const key of allKeys) {
        if (previousProps.current[key] !== props[key]) {
          changed[key] = [previousProps.current[key], props[key]];
        }
      }

      if (Object.keys(changed).length > 0) {
        console.group(`[why-did-you-update] ${name}`);
        for (const [key, [prev, next]] of Object.entries(changed)) {
          console.log(`${key}:`, prev, "→", next);
        }
        console.groupEnd();
      }
    }

    previousProps.current = props;
  });
}
