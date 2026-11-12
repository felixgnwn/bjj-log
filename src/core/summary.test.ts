import { describe, expect, it } from "vitest";
import { summarize } from "./summary.js";
import type { Result, Session } from "./types.js";

function session(position: string, result: Result): Session {
  return {
    date: "10 November 2026",
    position,
    whatYouTried: "something",
    result,
    why: "because",
  };
}

describe("summarize", () => {
  it("returns an empty list for no sessions", () => {
    expect(summarize([])).toEqual([]);
  });

  it("counts yes and partly as worked, and no as not worked", () => {
    const result = summarize([
      session("Closed guard", "yes"),
      session("Closed guard", "partly"),
      session("Closed guard", "no"),
    ]);

    expect(result).toEqual([{ position: "closed guard", total: 3, worked: 2 }]);
  });

  it("treats positions case-insensitively and ignores surrounding spaces", () => {
    const result = summarize([
      session("Closed guard", "yes"),
      session("  CLOSED GUARD ", "no"),
    ]);

    expect(result).toEqual([{ position: "closed guard", total: 2, worked: 1 }]);
  });

  it("puts the most-practised position first", () => {
    const result = summarize([
      session("Triangle", "yes"),
      session("Closed guard", "yes"),
      session("Closed guard", "no"),
    ]);

    expect(result.map((r) => r.position)).toEqual(["closed guard", "triangle"]);
  });
});
