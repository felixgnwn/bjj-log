import express from "express";
import type { SessionStore } from "../core/sessionStore.js";
import { pool } from "../db/pool.js";
import { SessionRepository } from "../storage/sessionRepository.js";
import { parseId, validateSession } from "./validation.js";

const app = express();
const PORT = 3000;
const store: SessionStore = new SessionRepository(pool);

app.use(express.json());

app.get("/sessions", async (_req, res) => {
  res.json(await store.list());
});

app.get("/summary", async (_req, res) => {
  res.json(await store.summary());
});

app.post("/sessions", async (req, res) => {
  const parsed = validateSession(req.body);

  if (!parsed.ok) {
    res.status(400).json({ errors: parsed.errors });
    return;
  }

  try {
    const saved = await store.add(parsed.session);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving session:", err);
    res.status(500).json({ error: "Could not save session" });
  }
});

app.put("/sessions/:id", async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({ error: "id must be a positive integer" });
    return;
  }

  const parsed = validateSession(req.body);

  if (!parsed.ok) {
    res.status(400).json({ errors: parsed.errors });
    return;
  }

  const updated = await store.update(id, parsed.session);

  if (updated === null) {
    res.status(404).json({ error: `Session ${id} not found` });
    return;
  }

  res.json(updated);
});

app.delete("/sessions/:id", async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({ error: "id must be a positive integer" });
    return;
  }

  const deleted = await store.remove(id);

  if (!deleted) {
    res.status(404).json({ error: `Session ${id} not found` });
    return;
  }

  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
