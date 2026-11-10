import type { Session } from "./types.js";

export type PositionSummary = {
  position: string;
  total: number;
  worked: number;
};

// Pure: sessions in, summaries out, no printing. An API can reuse this.
export function summarize(sessions: Session[]): PositionSummary[] {
  const byPosition = new Map<string, PositionSummary>();

  for (const s of sessions) {
    const position = s.position.trim().toLowerCase();

    // 1. Create the starting entry once per position
    const entry = byPosition.get(position) ?? { position, total: 0, worked: 0 };

    // 2. Every session counts toward the total
    entry.total += 1;

    // 3. "partly" counts as a success on purpose
    if (s.result === "yes" || s.result === "partly") {
      entry.worked += 1;
    }

    byPosition.set(position, entry);
  }

  // Most-practised positions first
  return [...byPosition.values()].sort((a, b) => b.total - a.total);
}
