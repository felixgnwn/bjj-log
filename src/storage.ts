import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { parseCsv, toCsvField } from "./csv.js";
import { COLUMNS, isResult, type Session } from "./types.js";

const FILE_PATH = "./src/data/logs.csv";

// True if the file is missing or empty -> we need a header
async function needsHeader(): Promise<boolean> {
  try {
    const info = await stat(FILE_PATH);
    return info.size === 0;
  } catch {
    return true;
  }
}

// Throws on failure; the caller decides what to show
export async function appendSession(session: Session): Promise<void> {
  await mkdir(dirname(FILE_PATH), { recursive: true });

  const lines: string[] = [];

  if (await needsHeader()) {
    lines.push(COLUMNS.map(toCsvField).join(","));
  }

  lines.push(COLUMNS.map((col) => toCsvField(session[col])).join(","));

  await appendFile(FILE_PATH, lines.join("\n") + "\n", "utf8");
}

// Same order as COLUMNS. Returns null if the result isn't valid.
function rowToSession(row: string[]): Session | null {
  const [
    date = "",
    position = "",
    whatYouTried = "",
    rawResult = "",
    why = "",
  ] = row;
  const result = rawResult.trim().toLowerCase();

  if (!isResult(result)) return null;

  return { date, position, whatYouTried, result, why };
}

export async function loadSessions(): Promise<Session[]> {
  let text: string;

  try {
    text = await readFile(FILE_PATH, "utf8");
  } catch {
    return []; // file doesn't exist yet
  }

  const sessions: Session[] = [];

  // slice(1) skips the header row
  for (const row of parseCsv(text).slice(1)) {
    const session = rowToSession(row);

    if (session) {
      sessions.push(session);
    } else {
      console.warn(`Skipping row with unrecognised result: ${row.join(" | ")}`);
    }
  }

  return sessions;
}
