"use client";

import { useEffect, useState } from "react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface ScreenReaderAnnouncementProps {
  message: string;
  politeness?: "polite" | "assertive";
}

/**
 * Announces messages to screen readers via an aria-live region.
 * The message is visually hidden but read aloud by assistive technology.
 */
export function ScreenReaderAnnouncement({
  message,
  politeness = "polite",
}: ScreenReaderAnnouncementProps) {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    if (message) setAnnouncements((prev) => [...prev.slice(-5), message]);
  }, [message]);

  return (
    <div aria-live={politeness} aria-atomic="true">
      {announcements.map((msg, i) => (
        <VisuallyHidden key={i} as="span">
          {msg}
        </VisuallyHidden>
      ))}
    </div>
  );
}
