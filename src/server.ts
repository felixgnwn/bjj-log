import express from "express";
import { appendSession, loadSessions } from "./storage.js";
import { summarize } from "./summary.js";
import { validateSession } from "./validation.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/sessions", async (_req, res) => {
  const sessions = await loadSessions();
  res.json(sessions);
});

app.get("/summary", async (_req, res) => {
  const sessions = await loadSessions();
  res.json(summarize(sessions));
});

app.post("/sessions", async (req, res) => {
  const parsed = validateSession(req.body);

  if (!parsed.ok) {
    res.status(400).json({ errors: parsed.errors });
    return;
  }

  try {
    await appendSession(parsed.session);
    res.status(201).json(parsed.session);
  } catch (err) {
    console.error("Error saving session:", err);
    res.status(500).json({ error: "Could not save session" });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
