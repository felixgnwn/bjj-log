import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
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

// Reads CSV text into rows of fields. Handles quoted fields, commas inside quotes, and doubled quotes ("") meaning a literal quote.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);

    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false; // closing quote
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  // Last line without a trailing newline
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
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

async function loadSessions(): Promise<Session[]> {
  let text: string;

  try {
    text = await readFile(FILE_PATH, "utf8");
  } catch {
    return []; // file doesn't exist yet
  }

  const sessions: Session[] = [];

  // slice(1) skips the header row
  for (const row of parseCsv(text).slice(1)) {
    // Same order as COLUMNS; defaults cover missing fields
    const [
      date = "",
      position = "",
      whatYouTried = "",
      rawResult = "",
      why = "",
    ] = row;
    const result = rawResult.trim().toLowerCase();

    if (!isResult(result)) {
      console.log(
        `Skipping unrecognised result '${rawResult}' for '${position}'`,
      );
      continue;
    }

    sessions.push({ date, position, whatYouTried, result, why });
  }

  return sessions;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function showSessions(sessions: Session[]) {
  if (sessions.length === 0) {
    console.log("\nNo sessions logged yet.");
    return;
  }

  const body = sessions.map((s) => COLUMNS.map((col) => truncate(s[col], 30)));

  // Widest cell in each column, header included
  const widths = COLUMNS.map((col, i) =>
    Math.max(col.length, ...body.map((row) => (row[i] ?? "").length)),
  );

  const formatRow = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join(" | ");

  console.log();
  console.log(formatRow([...COLUMNS]));
  console.log(widths.map((w) => "-".repeat(w)).join("-+-"));
  for (const row of body) {
    console.log(formatRow(row));
  }
}

function showSummary(sessions: Session[]) {
  if (sessions.length === 0) {
    console.log("\nNo sessions logged yet.");
    return;
  }

  const seen = new Map<string, { total: number; worked: number }>();

  for (const s of sessions) {
    const position = s.position.trim().toLowerCase();

    // 1. Create the starting entry once per position
    const entry = seen.get(position) ?? { total: 0, worked: 0 };

    // 2. Every session counts toward the total
    entry.total += 1;

    // 3. "partly" counts as a success on purpose
    if (s.result === "yes" || s.result === "partly") {
      entry.worked += 1;
    }

    seen.set(position, entry);
  }

  console.log();
  // Most-practised positions first
  const sorted = [...seen.entries()].sort((a, b) => b[1].total - a[1].total);

  for (const [position, { total, worked }] of sorted) {
    const percent = Math.round((worked / total) * 100);
    console.log(`${position}: ${worked}/${total} (${percent}%)`);
  }
}

function today(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Shows the question with a prefilled answer the user can edit or delete
async function askWithDefault(
  rl: readline.Interface,
  question: string,
  defaultValue: string,
): Promise<string> {
  const answer = rl.question(question);
  rl.write(defaultValue);
  return (await answer).trim() || defaultValue;
}

async function addEntry(rl: readline.Interface) {
  const date = await askWithDefault(rl, "\nWhats the date?: ", today());
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
      showSessions(await loadSessions());
      await rl.question("\nPress Enter to go back to the menu...");
    } else if (option === "3") {
      showSummary(await loadSessions());
      await rl.question("\nPress Enter to go back to the menu...");
    } else if (option === "0") {
      running = false;
    } else {
      console.log("\nPlease choose 1, 2, 3, or 0.");
    }
  }

  rl.close();
}

main().catch(console.error);
