import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { appendFile, mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";

const FILE_PATH = "./src/data/logs.csv";

type Result = "yes" | "no" | "partly";

type Session = {
  date: string;
  position: string;
  whatYouTried: string;
  result: Result;
  why: string;
};

const COLUMNS: (keyof Session)[] = [
  "date",
  "position",
  "whatYouTried",
  "result",
  "why",
];

function isResult(value: string): value is Result {
  return value === "yes" || value === "no" || value === "partly";
}

function toCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function needsHeader(filePath: string): Promise<boolean> {
  try {
    const info = await stat(filePath);
    return info.size === 0;
  } catch {
    return true;
  }
}

async function appendData(filePath: string, data: Session) {
  try {
    await mkdir(dirname(filePath), { recursive: true });

    const lines: string[] = [];

    if (await needsHeader(filePath)) {
      lines.push(COLUMNS.map(toCsvField).join(","));
    }

    lines.push(COLUMNS.map((col) => toCsvField(data[col])).join(","));

    await appendFile(filePath, lines.join("\n") + "\n", "utf8");
    console.log("Row Added");
  } catch (err) {
    console.error("Error appending row:", err);
  }
}

async function addEntry(rl: readline.Interface) {
  const date = await rl.question("\nWhats the date?: ");
  const position = await rl.question("Whats the position?: ");
  const whatYouTried = await rl.question("What did you try?: ");

  let result: Result | undefined;

  while (result === undefined) {
    const answer = (await rl.question("Whats the result? (yes, no, partly): "))
      .trim()
      .toLowerCase();

    if (isResult(answer)) {
      result = answer;
    } else {
      console.log("Please type yes, no, or partly.");
    }
  }

  const why = await rl.question("Why do you think that?: ");

  const session: Session = { date, position, whatYouTried, result, why };

  await appendData(FILE_PATH, session);
}

async function main() {
  const rl = readline.createInterface({ input, output });

  let running = true;

  while (running) {
    console.log("\n1. Log your training session");
    console.log("2. See all your sessions");
    console.log("3. Summary");
    console.log("0. Exit\n");

    const option = (await rl.question("Choose an option: ")).trim();

    if (option === "1") {
      await addEntry(rl);
    } else if (option === "2") {
      console.log("\nNot built yet (step 5).");
    } else if (option === "3") {
      console.log("\nNot built yet (step 6).");
    } else if (option === "0") {
      running = false;
    } else {
      console.log("\nPlease choose 1, 2, 3, or 0.");
    }
  }

  rl.close();
}

main().catch(console.error);
