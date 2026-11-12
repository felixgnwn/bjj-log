import { z } from "zod";
import { RESULTS, type Session } from "../core/types.js";

const text = z.string().trim().min(1, "must not be empty");

const sessionSchema = z.object({
  date: text,
  position: text,
  whatYouTried: text,
  // "Yes " and "YES" are accepted and stored as "yes"
  result: z.string().trim().toLowerCase().pipe(z.enum(RESULTS)),
  why: text,
});

type ValidationResult =
  | { ok: true; session: Session }
  | { ok: false; errors: string[] };

// Takes anything (the request body could be anything) and returns either
// a valid Session or a list of what's wrong with it
export function validateSession(body: unknown): ValidationResult {
  const parsed = sessionSchema.safeParse(body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const field = issue.path.map(String).join(".") || "body";
      return `${field}: ${issue.message}`;
    });

    return { ok: false, errors };
  }

  return { ok: true, session: parsed.data };
}

// Postgres SERIAL is a 32-bit integer, so anything bigger can't exist
const MAX_ID = 2_147_483_647;

// Turns the ":id" part of a URL into a number, or null if it isn't a valid id
export function parseId(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw)) return null;

  const id = Number(raw);

  return id >= 1 && id <= MAX_ID ? id : null;
}
