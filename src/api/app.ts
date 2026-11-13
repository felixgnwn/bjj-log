import { randomUUID } from "node:crypto";
import express, { type Express } from "express";
import type { Logger } from "pino";
import { pinoHttp } from "pino-http";
import type { SessionService } from "../core/sessionService.js";
import { errorHandler } from "./errorHandler.js";
import { createSessionController } from "./sessionController.js";

// Reuse a sane incoming request id (from a proxy or client), otherwise make one
function requestId(incoming: string | string[] | undefined): string {
  return typeof incoming === "string" && /^[\w-]{1,64}$/.test(incoming)
    ? incoming
    : randomUUID();
}

// The logger is passed in, so tests can hand it a silent one
export function createApp(service: SessionService, logger: Logger): Express {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = requestId(req.headers["x-request-id"]);
        res.setHeader("x-request-id", id);
        return id;
      },
      // Hosts poll /health every few seconds; keep it out of the logs
      autoLogging: { ignore: (req) => req.url === "/health" },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  // Liveness only: "the process is up". It deliberately doesn't touch the database.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(express.json());
  app.use(createSessionController(service));
  app.use(errorHandler); // must come last

  return app;
}
