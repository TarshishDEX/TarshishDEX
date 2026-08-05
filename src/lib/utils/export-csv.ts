/**
 * CSV export utilities for downloading portfolio and trade history data.
 * All exports run entirely client-side — no server round-trip needed.
 */

/**
 * Convert an array of objects to a CSV string.
 * Handles values containing commas and quotes by wrapping in double quotes.
 */
export function objectsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: (keyof T)[],
  headers?: string[]
): string {
  const headerRow = (headers ?? columns.map(String)).join(",");

  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        const value = String(row[col] ?? "");
        // Escape values containing commas, quotes, or newlines
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType = "text/csv"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV and trigger download with a timestamped filename.
 */
export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: (keyof T)[],
  name: string,
  headers?: string[]
): void {
  if (rows.length === 0) return;
  const csv = objectsToCsv(rows, columns, headers);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `${name}-${timestamp}.csv`);
}
