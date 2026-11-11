import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { SessionStore } from "../core/sessionStore.js";
import { pool } from "../db/pool.js";
import { SessionRepository } from "../storage/sessionRepository.js";
import { showSessions, showSummary } from "./display.js";
import { askSession } from "./prompts.js";

const MENU = `
1. Log your training session
2. See all your sessions
3. Summary
0. Exit
`;

async function addEntry(
  rl: readline.Interface,
  store: SessionStore,
): Promise<void> {
  const session = await askSession(rl);

  try {
    const saved = await store.add(session);
    console.log(`Saved as #${saved.id}`);
  } catch (err) {
    console.error("Error saving session:", err);
  }
}

async function pause(rl: readline.Interface): Promise<void> {
  await rl.question("\nPress Enter to go back to the menu...");
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const store: SessionStore = new SessionRepository(pool);

  try {
    let running = true;

    while (running) {
      console.log(MENU);
      const option = (await rl.question("Choose an option: ")).trim();

      switch (option) {
        case "1":
          await addEntry(rl, store);
          break;
        case "2":
          showSessions(await store.list());
          await pause(rl);
          break;
        case "3":
          showSummary(await store.summary());
          await pause(rl);
          break;
        case "0":
          running = false;
          break;
        default:
          console.log("\nPlease choose 1, 2, 3, or 0.");
      }
    }
  } finally {
    rl.close();
    await pool.end(); // without this, the open connection keeps Node running
  }
}

main().catch(console.error);
