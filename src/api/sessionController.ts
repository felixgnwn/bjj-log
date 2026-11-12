import { Router } from "express";
import type { SessionService } from "../core/sessionService.js";
import { parseId, validateSession } from "./validation.js";

export function createSessionController(service: SessionService): Router {
  const router = Router();

  router.get("/sessions", async (_req, res) => {
    res.json(await service.list());
  });

  router.get("/summary", async (_req, res) => {
    res.json(await service.summary());
  });

  router.post("/sessions", async (req, res) => {
    const parsed = validateSession(req.body);

    if (!parsed.ok) {
      res.status(400).json({ errors: parsed.errors });
      return;
    }

    res.status(201).json(await service.add(parsed.session));
  });

  router.put("/sessions/:id", async (req, res) => {
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

    res.json(await service.update(id, parsed.session));
  });

  router.delete("/sessions/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({ error: "id must be a positive integer" });
      return;
    }

    await service.remove(id);
    res.sendStatus(204);
  });

  return router;
}
