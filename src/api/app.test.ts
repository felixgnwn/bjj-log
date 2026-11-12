import type { Express } from "express";
import { pino } from "pino";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { SessionService } from "../core/sessionService.js";
import type { SessionStore } from "../core/sessionStore.js";
import { InMemoryStore } from "../testing/inMemoryStore.js";
import { createApp } from "./app.js";

const silent = pino({ level: "silent" });

const validBody = {
  date: "10 November 2026",
  position: "Closed guard",
  whatYouTried: "Hip bump sweep",
  result: "Yes",
  why: "They posted on one hand",
};

function appWith(store: SessionStore): Express {
  return createApp(new SessionService(store), silent);
}

// A store whose list() fails, to test the 500 path
class FailingStore extends InMemoryStore {
  override async list(): Promise<never> {
    throw new Error("boom: secret database detail");
  }
}

describe("API", () => {
  let app: Express;

  beforeEach(() => {
    app = appWith(new InMemoryStore());
  });

  describe("GET /sessions", () => {
    it("returns an empty list at first", async () => {
      const res = await request(app).get("/sessions");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /sessions", () => {
    it("creates a session and normalises the result", async () => {
      const res = await request(app).post("/sessions").send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 1, ...validBody, result: "yes" });
    });

    it("rejects invalid input with a list of errors, and saves nothing", async () => {
      const res = await request(app)
        .post("/sessions")
        .send({ date: "", position: "Closed guard", result: "banana" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("result")]),
      );

      const list = await request(app).get("/sessions");
      expect(list.body).toEqual([]);
    });

    it("answers malformed JSON with a JSON 400", async () => {
      const res = await request(app)
        .post("/sessions")
        .set("Content-Type", "application/json")
        .send("{bad");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Bad request" });
    });
  });

  describe("PUT /sessions/:id", () => {
    it("replaces a session", async () => {
      await request(app).post("/sessions").send(validBody);

      const res = await request(app)
        .put("/sessions/1")
        .send({ ...validBody, result: "partly", why: "Passing didn't work" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 1,
        ...validBody,
        result: "partly",
        why: "Passing didn't work",
      });
    });

    it("returns 404 for a missing session", async () => {
      const res = await request(app).put("/sessions/999").send(validBody);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Session 999 not found" });
    });

    it("returns 400 for an invalid id", async () => {
      const res = await request(app).put("/sessions/abc").send(validBody);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "id must be a positive integer" });
    });

    it("returns 400 for an invalid body", async () => {
      await request(app).post("/sessions").send(validBody);

      const res = await request(app)
        .put("/sessions/1")
        .send({ result: "banana" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeInstanceOf(Array);
    });
  });

  describe("DELETE /sessions/:id", () => {
    it("deletes a session, then reports it missing", async () => {
      await request(app).post("/sessions").send(validBody);

      const first = await request(app).delete("/sessions/1");
      const second = await request(app).delete("/sessions/1");

      expect(first.status).toBe(204);
      expect(second.status).toBe(404);
    });

    it.each(["abc", "0", "99999999999"])(
      "returns 400 for id %s",
      async (id) => {
        const res = await request(app).delete(`/sessions/${id}`);

        expect(res.status).toBe(400);
      },
    );
  });

  describe("GET /summary", () => {
    it("groups positions case-insensitively and counts partly as worked", async () => {
      await request(app).post("/sessions").send(validBody);
      await request(app)
        .post("/sessions")
        .send({ ...validBody, position: " CLOSED GUARD ", result: "no" });

      const res = await request(app).get("/summary");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { position: "closed guard", total: 2, worked: 1 },
      ]);
    });
  });

  describe("request ids", () => {
    it("adds an x-request-id header to every response", async () => {
      const res = await request(app).get("/sessions");

      expect(res.headers["x-request-id"]).toBeTruthy();
    });

    it("keeps a sane id sent by the client", async () => {
      const res = await request(app)
        .get("/sessions")
        .set("x-request-id", "my-test-123");

      expect(res.headers["x-request-id"]).toBe("my-test-123");
    });

    it("replaces an unsafe id with a generated one", async () => {
      const res = await request(app)
        .get("/sessions")
        .set("x-request-id", "bad id!");

      expect(res.headers["x-request-id"]).toBeTruthy();
      expect(res.headers["x-request-id"]).not.toBe("bad id!");
    });
  });

  describe("unexpected errors", () => {
    it("returns a generic 500 and doesn't leak details", async () => {
      const failingApp = appWith(new FailingStore());

      const res = await request(failingApp).get("/sessions");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
      expect(JSON.stringify(res.body)).not.toContain("boom");
    });
  });
});
