"use client";

import { useEffect } from "react";
import { registerSW } from "@/lib/sw-register";

/**
 * Client component that registers the PWA service worker on mount.
 * Add this once to the root layout.
 */
export function SWRegistrar() {
  useEffect(() => {
    registerSW();
  }, []);

  return null;
}
