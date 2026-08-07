"use client";

import { useEffect, useReducer } from "react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface ScreenReaderAnnouncementProps {
  message: string;
  politeness?: "polite" | "assertive";
}

type Action = { type: "append"; message: string };

function reducer(state: string[], action: Action): string[] {
  if (action.type === "append") {
    return [...state.slice(-5), action.message];
  }
  return state;
}

/**
 * Announces messages to screen readers via an aria-live region.
 * The message is visually hidden but read aloud by assistive technology.
 */
export function ScreenReaderAnnouncement({
  message,
  politeness = "polite",
}: ScreenReaderAnnouncementProps) {
  const [announcements, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    if (message) dispatch({ type: "append", message });
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
