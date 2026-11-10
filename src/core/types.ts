const RESULTS = ["yes", "no", "partly"] as const;

export type Result = (typeof RESULTS)[number];

export type Session = {
  date: string;
  position: string;
  whatYouTried: string;
  result: Result;
  why: string;
};

// Column order lives in one place
export const COLUMNS: (keyof Session)[] = [
  "date",
  "position",
  "whatYouTried",
  "result",
  "why",
];

export function isResult(value: string): value is Result {
  return (RESULTS as readonly string[]).includes(value);
}
