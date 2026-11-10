import type { PositionSummary } from "./summary.js";
import { COLUMNS, type Session } from "./types.js";

const MAX_CELL_WIDTH = 30;

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

export function showSessions(sessions: Session[]): void {
  if (sessions.length === 0) {
    console.log("\nNo sessions logged yet.");
    return;
  }

  const body = sessions.map((s) =>
    COLUMNS.map((col) => truncate(s[col], MAX_CELL_WIDTH)),
  );

  // Widest cell in each column, header included
  const widths = COLUMNS.map((col, i) =>
    Math.max(col.length, ...body.map((row) => (row[i] ?? "").length)),
  );

  const formatRow = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join(" | ");

  console.log();
  console.log(formatRow([...COLUMNS]));
  console.log(widths.map((w) => "-".repeat(w)).join("-+-"));
  for (const row of body) {
    console.log(formatRow(row));
  }
}

export function showSummary(summaries: PositionSummary[]): void {
  if (summaries.length === 0) {
    console.log("\nNo sessions logged yet.");
    return;
  }

  console.log();
  for (const { position, total, worked } of summaries) {
    const percent = Math.round((worked / total) * 100);
    console.log(`${position}: ${worked}/${total} (${percent}%)`);
  }
}
