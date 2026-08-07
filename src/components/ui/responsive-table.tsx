import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that makes tables horizontally scrollable on small screens
 * while keeping sticky headers and clean borders.
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

/** Standard thead with uppercase labels matching the design system. */
export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-border text-foreground-faint border-b text-left text-xs tracking-wider uppercase">
        {children}
      </tr>
    </thead>
  );
}

/** Standard th with consistent padding. */
export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-6 py-3 font-medium", align === "right" && "text-right", className)}>
      {children}
    </th>
  );
}

/** Standard tbody with hover rows. */
export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

/** Standard tr with hover and border. */
export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        "border-border/50 hover:bg-surface border-b transition-colors last:border-0",
        className
      )}
    >
      {children}
    </tr>
  );
}

/** Standard td. */
export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td
      className={cn(
        "px-6 py-3.5",
        align === "right" && "text-right font-mono tabular-nums",
        className
      )}
    >
      {children}
    </td>
  );
}
