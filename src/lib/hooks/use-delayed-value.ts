"use client";

import { useEffect, useReducer } from "react";

type Action<T> = { type: "set"; value: T } | { type: "reset"; value: T };

function reducer<T>(_state: T, action: Action<T>): T {
  return action.value;
}

/**
 * Returns `value` immediately, then resets to `resetValue` after `delayMs`.
 * Useful for "Copied!" feedback, temporary highlights, etc.
 */
export function useDelayedValue<T>(value: T, resetValue: T, delayMs = 2000): T {
  const [display, dispatch] = useReducer(reducer<T>, resetValue);

  useEffect(() => {
    if (value === resetValue) return;
    dispatch({ type: "set", value });
    const timer = setTimeout(() => dispatch({ type: "reset", value: resetValue }), delayMs);
    return () => clearTimeout(timer);
  }, [value, resetValue, delayMs]);

  return display;
}
