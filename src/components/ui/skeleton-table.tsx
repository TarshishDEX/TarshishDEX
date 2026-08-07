import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

// Deterministic widths to avoid Math.random() during render.
const HEADER_WIDTHS = [65, 72, 85, 78, 60, 90, 75, 82];
const CELL_WIDTHS = [45, 58, 72, 85, 65, 55, 90, 68, 78, 50, 82, 60];

/**
 * Realistic table skeleton with header and staggered row animations.
 */
export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  const tableData = useMemo(
    () => ({
      headers: Array.from({ length: columns }, (_, i) => ({
        width: `${HEADER_WIDTHS[i % HEADER_WIDTHS.length]}%`,
      })),
      rows: Array.from({ length: rows }, (_, rowIdx) => ({
        delay: `${rowIdx * 100}ms`,
        cells: Array.from({ length: columns }, (__, colIdx) => ({
          width: `${CELL_WIDTHS[(rowIdx * columns + colIdx) % CELL_WIDTHS.length]}%`,
        })),
      })),
    }),
    [rows, columns]
  );

  return (
    <div className={cn("animate-pulse", className)} aria-hidden="true">
      {/* Header */}
      <div className="border-border flex gap-6 border-b px-6 py-3">
        {tableData.headers.map((h, i) => (
          <div
            key={i}
            className="bg-surface-elevated h-3 rounded"
            style={{ width: h.width }}
          />
        ))}
      </div>
      {/* Rows */}
      {tableData.rows.map((row, i) => (
        <div
          key={i}
          className="border-border/50 flex gap-6 border-b px-6 py-4"
          style={{ animationDelay: row.delay }}
        >
          {row.cells.map((cell, j) => (
            <div
              key={j}
              className="bg-surface-elevated h-4 rounded"
              style={{ width: cell.width }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
