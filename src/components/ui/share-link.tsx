"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShareLinkProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
}

/**
 * Share button using the native Web Share API on supported devices,
 * with a clipboard fallback for desktop browsers.
 */
export function ShareLink({ url, title, text, className }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, title, text });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
        className
      )}
      aria-label="Share link"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M13 4l4 4m0 0l-4 4m4-4H7a4 4 0 000 8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
