import pg from "pg";
import { config } from "../config.js";

// One pool for the whole app: it reuses connections instead of opening a new one per query
export const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
