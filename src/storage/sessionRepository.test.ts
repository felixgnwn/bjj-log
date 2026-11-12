import "dotenv/config";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { summarize, type PositionSummary } from "../core/summary.js";
import type { Session } from "../core/types.js";
import { SCHEMA } from "../db/schema.js";
import { SessionRepository } from "./sessionRepository.js";

const url = process.env["TEST_DATABASE_URL"];

// TRUNCATE wipes the table, so refuse to run against anything but a *_test database
if (url && !new URL(url).pathname.endsWith("_test")) {
  throw new Error(
    "TEST_DATABASE_URL must point at a database whose name ends with _test",
  );
}

const sample: Session = {
  date: "10 November 2026",
  position: "Closed guard",
  whatYouTried: "Hip bump sweep",
  result: "yes",
  why: "They posted on one hand",
};

function byPosition(a: PositionSummary, b: PositionSummary): number {
  return a.position.localeCompare(b.position);
}

// Skipped (not failed) when TEST_DATABASE_URL isn't set
describe.skipIf(!url)("SessionRepository (Postgres)", () => {
  let pool: pg.Pool;
  let repo: SessionRepository;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: url ?? "" });
    await pool.query(SCHEMA);
    repo = new SessionRepository(pool);
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE sessions RESTART IDENTITY");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("adds a session and returns it with an id", async () => {
    const saved = await repo.add(sample);

    expect(saved).toEqual({ id: 1, ...sample });
  });

  it("lists sessions oldest first", async () => {
    await repo.add(sample);
    await repo.add({ ...sample, position: "Triangle" });

    const list = await repo.list();

    expect(list.map((s) => s.position)).toEqual(["Closed guard", "Triangle"]);
  });

  it("updates a session, and returns null for a missing one", async () => {
    const saved = await repo.add(sample);

    const updated = await repo.update(saved.id, { ...sample, result: "no" });
    const missing = await repo.update(999, sample);

    expect(updated).toEqual({ id: saved.id, ...sample, result: "no" });
    expect(missing).toBeNull();
  });

  it("removes a session, and reports false for a missing one", async () => {
    const saved = await repo.add(sample);

    expect(await repo.remove(saved.id)).toBe(true);
    expect(await repo.remove(saved.id)).toBe(false);
    expect(await repo.list()).toEqual([]);
  });

  it("lets the database reject a result the app would never send", async () => {
    await expect(
      pool.query(
        `INSERT INTO sessions (date, position, what_you_tried, result, why)
         VALUES ('x', 'x', 'x', 'banana', 'x')`,
      ),
    ).rejects.toThrow();
  });

  it("summarises per position, case-insensitively, with partly as worked", async () => {
    await repo.add({ ...sample, position: "Closed guard", result: "yes" });
    await repo.add({ ...sample, position: " closed guard ", result: "no" });
    await repo.add({ ...sample, position: "Triangle", result: "partly" });

    const summary = [...(await repo.summary())].sort(byPosition);

    expect(summary).toEqual([
      { position: "closed guard", total: 2, worked: 1 },
      { position: "triangle", total: 1, worked: 1 },
    ]);
  });

  it("gives the same summary as the pure summarize() function", async () => {
    await repo.add({ ...sample, position: "Closed guard", result: "yes" });
    await repo.add({ ...sample, position: "closed guard", result: "no" });
    await repo.add({ ...sample, position: "Triangle", result: "partly" });
    await repo.add({ ...sample, position: "Triangle", result: "no" });
    await repo.add({ ...sample, position: "S-Mount", result: "yes" });

    const fromSql = [...(await repo.summary())].sort(byPosition);
    const fromCode = summarize(await repo.list()).sort(byPosition);

    expect(fromSql).toEqual(fromCode);
  });
});
