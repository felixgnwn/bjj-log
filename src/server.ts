import express from "express";
import { loadSessions } from "./storage.js";
import { summarize } from "./summary.js";

const app = express();
const PORT = 3000;

app.get("/sessions", async (_req, res) => {
  const sessions = await loadSessions();
  res.json(sessions);
});

app.get("/summary", async (_req, res) => {
  const sessions = await loadSessions();
  res.json(summarize(sessions));
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
