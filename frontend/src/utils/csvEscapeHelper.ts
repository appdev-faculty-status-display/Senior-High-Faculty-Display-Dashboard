// frontend/src/utils/csvEscapeHelper.ts

export function csvCell(value: string): string {
  const safe = String(value).replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${safe}"`;
}

/**
 * Builds and triggers a CSV file download from a 2D array of string rows.
 * Every cell is automatically escaped via csvCell().
 *
 * @param rows     
 * @param filename 
 */
export function downloadCSV(rows: string[][], filename: string): void {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}