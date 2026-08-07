import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  fallback?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

const pixelMap = { sm: 32, md: 40, lg: 56 } as const;

/**
 * Avatar component with image optimization via next/image and text fallback.
 */
export function Avatar({ src, alt, size = "md", fallback, className }: AvatarProps) {
  const initials = fallback?.slice(0, 2).toUpperCase() ?? alt.slice(0, 2).toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-semibold",
        "bg-gradient-to-br from-primary/30 to-accent/30 text-foreground",
        sizeMap[size],
        className
      )}
      role="img"
      aria-label={alt}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={pixelMap[size]}
          height={pixelMap[size]}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
