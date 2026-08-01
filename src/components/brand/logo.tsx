"use client";

import { useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** TarshishDEX brand mark — a stylized wave formed from the letter T. */
export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#5ba0fd" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="#0b101c"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
      />
      <path
        d="M9 9h14M16 9v14M16 23c4 0 6-2.2 6-5"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-300 group-hover:scale-105" />
      <span className="font-display text-lg font-semibold tracking-tight">
        Tarshish<span className="text-gradient">DEX</span>
      </span>
    </Link>
  );
}
