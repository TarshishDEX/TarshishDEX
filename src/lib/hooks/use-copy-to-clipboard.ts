"use client";

import { useState, useCallback } from "react";

interface UseCopyToClipboardResult {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
}

/**
 * Copy text to clipboard with a short-lived "copied" feedback state.
 * Resets automatically after 2 seconds.
 */
export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, []);

  return { copy, copied };
}
