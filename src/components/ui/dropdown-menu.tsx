"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  align?: "left" | "right";
}

export function DropdownMenu({ trigger, items, onSelect, align = "right" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        onSelect(items[activeIndex]!.id);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, items, activeIndex, onSelect]);

  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={cn(
            "glass-card animate-fade-in absolute top-full z-50 mt-2 w-56 overflow-hidden rounded-xl p-1.5",
            alignClass
          )}
          role="menu"
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                i === activeIndex ? "bg-surface-elevated" : "hover:bg-surface-elevated",
                item.danger ? "text-danger" : "text-foreground"
              )}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
