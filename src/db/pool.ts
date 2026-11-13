import pg from "pg";
import { config } from "../config.js";
import { logger } from "../logger.js";

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 5, // a one-user API doesn't need more, and free databases limit connections
  idleTimeoutMillis: 10_000, // drop idle connections before the database does
  connectionTimeoutMillis: 15_000, // allow time for a suspended database to wake up
});

// An idle connection can be killed by the database (Neon suspends when idle).
// Without this listener, pg's "error" event would crash the process.
pool.on("error", (err) => {
  logger.warn({ err }, "Idle database connection error");
});
