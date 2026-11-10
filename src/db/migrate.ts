import { pool } from "./pool.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  position TEXT NOT NULL,
  what_you_tried TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('yes', 'no', 'partly')),
  why TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function migrate(): Promise<void> {
  await pool.query(SCHEMA);

  const { rows } = await pool.query(
    "SELECT count(*)::int AS count FROM sessions",
  );
  console.log(`Schema ready. Rows in sessions: ${rows[0]?.count ?? 0}`);
}

migrate()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end()); // without this, the script never exits
