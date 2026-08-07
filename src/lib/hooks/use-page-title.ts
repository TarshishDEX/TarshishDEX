"use client";

import { useEffect } from "react";

/**
 * Set the document title dynamically with the TarshishDEX suffix.
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title
      ? `${title} · TarshishDEX`
      : "TarshishDEX — Stellar Decentralized Exchange";
    return () => {
      document.title = previous;
    };
  }, [title]);
}
