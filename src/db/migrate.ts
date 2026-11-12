import { pool } from "./pool.js";
import { SCHEMA } from "./schema.js";

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
