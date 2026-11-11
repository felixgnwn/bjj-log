import { isResult, type Session } from "../core/types.js";

type ValidationResult =
  | { ok: true; session: Session }
  | { ok: false; errors: string[] };

// Reads one text field, recording an error if it's missing or empty
function readText(
  data: Record<string, unknown>,
  field: string,
  errors: string[],
): string {
  const value = data[field];

  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${field} must be a non-empty string`);
    return "";
  }

  return value.trim();
}

// Takes anything (the request body could be anything) and returns either a valid Session or a list of what's wrong with it
export function validateSession(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Body must be a JSON object"] };
  }

  const data = body as Record<string, unknown>;
  const errors: string[] = [];

  const date = readText(data, "date", errors);
  const position = readText(data, "position", errors);
  const whatYouTried = readText(data, "whatYouTried", errors);
  const why = readText(data, "why", errors);

  const rawResult = data["result"];
  const result =
    typeof rawResult === "string" ? rawResult.trim().toLowerCase() : "";

  if (!isResult(result)) {
    errors.push('result must be "yes", "no", or "partly"');
    return { ok: false, errors };
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, session: { date, position, whatYouTried, result, why } };
}

// Postgres SERIAL is a 32-bit integer, so anything bigger can't exist
const MAX_ID = 2_147_483_647;

// Turns the ":id" part of a URL into a number, or null if it isn't a valid id
export function parseId(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw)) return null;

  const id = Number(raw);

  return id >= 1 && id <= MAX_ID ? id : null;
}
