import { cloneElement, isValidElement, type ReactElement } from "react";
import { cn } from "@/lib/utils";

interface AccessibleIconProps {
  label: string;
  children: ReactElement<{ className?: string; "aria-hidden"?: boolean }>;
  className?: string;
}

/**
 * Wraps an SVG icon with an accessible label and removes it from the
 * accessibility tree as decorative while providing a text alternative.
 */
export function AccessibleIcon({ label, children, className }: AccessibleIconProps) {
  if (!isValidElement(children)) return children;

  return (
    <>
      {cloneElement(children, {
        "aria-hidden": true,
        className: cn(children.props.className, className),
      })}
      <span className="sr-only">{label}</span>
    </>
  );
}
