import "dotenv/config";
import pg from "pg";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
}

// One pool for the whole app: it reuses connections instead of opening a new one per query
export const pool = new pg.Pool({ connectionString });
