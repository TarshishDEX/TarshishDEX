"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Like useState, but prevents state updates after the component unmounts.
 * Avoids the "Can't perform a React state update on an unmounted component" warning.
 */
export function useSafeSetState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (mounted.current) {
      setState(value);
    }
  }, []);

  return [state, safeSetState];
}
