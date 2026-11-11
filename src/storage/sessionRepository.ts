import type { Pool } from "pg";
import type { SessionStore } from "../core/sessionStore.js";
import type { PositionSummary } from "../core/summary.js";
import { isResult, type Session, type StoredSession } from "../core/types.js";

// A row exactly as Postgres returns it (snake_case columns)
type SessionRow = {
  id: number;
  date: string;
  position: string;
  what_you_tried: string;
  result: string;
  why: string;
};

const SESSION_COLUMNS = "id, date, position, what_you_tried, result, why";

function toStoredSession(row: SessionRow): StoredSession {
  if (!isResult(row.result)) {
    throw new Error(`Row ${row.id} has an invalid result: ${row.result}`);
  }

  return {
    id: row.id,
    date: row.date,
    position: row.position,
    whatYouTried: row.what_you_tried,
    result: row.result,
    why: row.why,
  };
}

export class SessionRepository implements SessionStore {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async add(session: Session): Promise<StoredSession> {
    const { rows } = await this.pool.query<SessionRow>(
      `INSERT INTO sessions (date, position, what_you_tried, result, why)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SESSION_COLUMNS}`,
      [
        session.date,
        session.position,
        session.whatYouTried,
        session.result,
        session.why,
      ],
    );

    const row = rows[0];
    if (!row) throw new Error("Insert returned no row");

    return toStoredSession(row);
  }

  async list(): Promise<StoredSession[]> {
    const { rows } = await this.pool.query<SessionRow>(
      `SELECT ${SESSION_COLUMNS} FROM sessions ORDER BY id ASC`,
    );

    return rows.map(toStoredSession);
  }

  // "partly" counts as worked, on purpose (same rule as before)
  async summary(): Promise<PositionSummary[]> {
    const { rows } = await this.pool.query<PositionSummary>(
      `SELECT lower(trim(position)) AS position,
              count(*)::int AS total,
              (count(*) FILTER (WHERE result IN ('yes', 'partly')))::int AS worked
       FROM sessions
       GROUP BY lower(trim(position))
       ORDER BY total DESC, position ASC`,
    );

    return rows;
  }

  async update(id: number, session: Session): Promise<StoredSession | null> {
    const { rows } = await this.pool.query<SessionRow>(
      `UPDATE sessions
       SET date = $1, position = $2, what_you_tried = $3, result = $4, why = $5
       WHERE id = $6
       RETURNING ${SESSION_COLUMNS}`,
      [
        session.date,
        session.position,
        session.whatYouTried,
        session.result,
        session.why,
        id,
      ],
    );

    const row = rows[0];
    return row ? toStoredSession(row) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM sessions WHERE id = $1", [
      id,
    ]);

    // rowCount is how many rows the DELETE removed
    return (result.rowCount ?? 0) > 0;
  }
}
