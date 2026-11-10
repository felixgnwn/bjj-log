import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { showSessions, showSummary } from "./display.js";
import { askSession } from "./prompts.js";
import { appendSession, loadSessions } from "../storage/storage.js";
import { summarize } from "../core/summary.js";

const MENU = `
1. Log your training session
2. See all your sessions
3. Summary
0. Exit
`;

async function addEntry(rl: readline.Interface): Promise<void> {
  const session = await askSession(rl);

  try {
    await appendSession(session);
    console.log("Row Added");
  } catch (err) {
    console.error("Error saving session:", err);
  }
}

async function pause(rl: readline.Interface): Promise<void> {
  await rl.question("\nPress Enter to go back to the menu...");
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  let running = true;

  while (running) {
    console.log(MENU);
    const option = (await rl.question("Choose an option: ")).trim();

    switch (option) {
      case "1":
        await addEntry(rl);
        break;
      case "2":
        showSessions(await loadSessions());
        await pause(rl);
        break;
      case "3":
        showSummary(summarize(await loadSessions()));
        await pause(rl);
        break;
      case "0":
        running = false;
        break;
      default:
        console.log("\nPlease choose 1, 2, 3, or 0.");
    }
  }

  rl.close();
}

main().catch(console.error);
