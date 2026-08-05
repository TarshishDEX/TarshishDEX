"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

/**
 * Simple tab switcher with content panels.
 * Manages active tab state internally.
 */
export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div className={className}>
      <div className="border-border flex gap-1 border-b" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            onClick={() => setActive(tab.id)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              tab.id === active
                ? "text-foreground"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bg-primary-soft text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {tab.badge}
              </span>
            )}
            {tab.id === active && (
              <span className="bg-primary absolute inset-x-0 -bottom-px h-0.5 rounded-full" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-4" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}
