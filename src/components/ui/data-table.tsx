import { Card } from "@/components/ui/card";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface DataTableProps {
  children: React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  loadingColumns?: number;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  error?: string | null;
  className?: string;
}

/**
 * Smart table wrapper that handles loading, empty, and error states
 * so individual table components can focus on data rendering only.
 */
export function DataTable({
  children,
  loading,
  loadingRows = 5,
  loadingColumns = 4,
  empty,
  emptyTitle = "No data",
  emptyDescription,
  error,
  className,
}: DataTableProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {loading ? (
        <SkeletonTable rows={loadingRows} columns={loadingColumns} />
      ) : error ? (
        <div className="bg-danger-soft text-danger rounded-none px-6 py-8 text-center text-sm">
          {error}
        </div>
      ) : empty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        children
      )}
    </Card>
  );
}
