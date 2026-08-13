import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";

type LinkButtonProps = Omit<ButtonProps, "type" | "onClick"> & {
  href: string;
  external?: boolean;
};

export function LinkButton({
  href,
  external,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 select-none",
        "focus-visible:ring-primary/60 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "active:scale-[0.98]",
        variant === "primary" &&
          "bg-primary-solid shadow-primary/25 hover:bg-primary-solid-hover text-white shadow-lg",
        variant === "secondary" &&
          "border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-elevated border",
        size === "sm" && "h-8 rounded-lg px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-sm",
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </Link>
  );
}
