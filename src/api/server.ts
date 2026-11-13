import { config } from "../config.js";
import { SessionService } from "../core/sessionService.js";
import { pool } from "../db/pool.js";
import { logger } from "../logger.js";
import { SessionRepository } from "../storage/sessionRepository.js";
import { createApp } from "./app.js";

// The one place where the pieces get wired together
const service = new SessionService(new SessionRepository(pool));

const server = createApp(service, logger).listen(config.PORT, () => {
  logger.info(`API running on http://localhost:${config.PORT}`);
});

// Containers stop with SIGTERM. Finish in-flight requests, close the pool, then exit.
function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down");

  // Force exit if something never closes
  setTimeout(() => process.exit(1), 10_000).unref();

  server.close(() => {
    pool
      .end()
      .then(() => process.exit(0))
      .catch((err: unknown) => {
        logger.error({ err }, "Error closing the database pool");
        process.exit(1);
      });
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
