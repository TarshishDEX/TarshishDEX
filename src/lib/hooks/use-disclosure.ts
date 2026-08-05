"use client";

import { useState, useCallback } from "react";

/**
 * Generic open/close/toggle state for modals, drawers, dropdowns, etc.
 */
export function useDisclosure(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
