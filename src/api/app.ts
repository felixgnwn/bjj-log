import express, { type Express } from "express";
import type { SessionService } from "../core/sessionService.js";
import { errorHandler } from "./errorHandler.js";
import { createSessionController } from "./sessionController.js";

// Builds the app without starting it, so tests can use it too
export function createApp(service: SessionService): Express {
  const app = express();

  app.use(express.json());
  app.use(createSessionController(service));
  app.use(errorHandler); // must come last

  return app;
}
