import { describe, expect, it } from "vitest";
import { parseId, validateSession } from "./validation.js";

const valid = {
  date: "10 November 2026",
  position: "Closed guard",
  whatYouTried: "Hip bump sweep",
  result: "yes",
  why: "They posted on one hand",
};

describe("validateSession", () => {
  it("accepts a valid body", () => {
    expect(validateSession(valid)).toEqual({ ok: true, session: valid });
  });

  it("trims text and normalises the result", () => {
    const parsed = validateSession({
      ...valid,
      date: "  10 November 2026 ",
      result: "  PARTLY ",
    });

    expect(parsed).toEqual({
      ok: true,
      session: { ...valid, result: "partly" },
    });
  });

  it("drops fields it doesn't know about", () => {
    const parsed = validateSession({ ...valid, admin: true });

    expect(parsed).toEqual({ ok: true, session: valid });
  });

  it("reports every missing field", () => {
    const parsed = validateSession({});

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;

    for (const field of ["date", "position", "whatYouTried", "result", "why"]) {
      expect(parsed.errors.some((e) => e.startsWith(`${field}:`))).toBe(true);
    }
  });

  it("rejects an unknown result", () => {
    const parsed = validateSession({ ...valid, result: "banana" });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;

    expect(parsed.errors.some((e) => e.startsWith("result:"))).toBe(true);
  });

  it("rejects text that is only whitespace", () => {
    const parsed = validateSession({ ...valid, why: "   " });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;

    expect(parsed.errors.some((e) => e.startsWith("why:"))).toBe(true);
  });

  it.each([null, "text", 42, []])(
    "rejects a body that isn't an object: %j",
    (body) => {
      expect(validateSession(body).ok).toBe(false);
    },
  );
});

describe("parseId", () => {
  it.each([
    ["1", 1],
    ["42", 42],
    ["2147483647", 2147483647],
  ])("accepts %s", (raw, expected) => {
    expect(parseId(raw)).toBe(expected);
  });

  it.each([
    undefined,
    "",
    "abc",
    "0",
    "-1",
    "1.5",
    "1e3",
    " 1",
    "2147483648",
    "99999999999",
  ])("rejects %j", (raw) => {
    expect(parseId(raw)).toBeNull();
  });
});
