import { config } from "../config.js";
import { SessionService } from "../core/sessionService.js";
import { pool } from "../db/pool.js";
import { SessionRepository } from "../storage/sessionRepository.js";
import { createApp } from "./app.js";

// The one place where the pieces get wired together
const service = new SessionService(new SessionRepository(pool));

createApp(service).listen(config.PORT, () => {
  console.log(`API running on http://localhost:${config.PORT}`);
});
