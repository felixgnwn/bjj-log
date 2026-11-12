import { config } from "../config.js";
import { SessionService } from "../core/sessionService.js";
import { pool } from "../db/pool.js";
import { logger } from "../logger.js";
import { SessionRepository } from "../storage/sessionRepository.js";
import { createApp } from "./app.js";

// The one place where the pieces get wired together
const service = new SessionService(new SessionRepository(pool));

createApp(service, logger).listen(config.PORT, () => {
  logger.info(`API running on http://localhost:${config.PORT}`);
});
