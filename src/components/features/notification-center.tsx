"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "swap" | "alert" | "system";
  timestamp: number;
  read: boolean;
}

const MAX_NOTIFICATIONS = 50;

/**
 * In-memory notification center. Tracks swap completions, price alert
 * triggers, and system messages. Renders as a bell icon with unread badge.
 */
export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-surface hover:border-border-strong relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            d="M8 17a2 2 0 004 0M4 8a6 6 0 0112 0v3l2 3H2l2-3V8z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="bg-primary absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-card animate-fade-in absolute top-12 right-0 z-50 w-80 overflow-hidden rounded-2xl shadow-2xl">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex gap-2">
              <button onClick={markAllRead} className="text-primary text-xs hover:underline">
                Mark read
              </button>
              <button onClick={clearAll} className="text-foreground-faint text-xs hover:underline">
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-foreground-faint px-4 py-8 text-center text-sm">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-border/50 border-b px-4 py-3 text-sm transition-colors",
                    !n.read && "bg-primary-soft/30"
                  )}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-foreground-muted mt-0.5 text-xs">{n.body}</p>
                  <p className="text-foreground-faint mt-1 text-[10px]">
                    {new Date(n.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
