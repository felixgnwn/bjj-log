import type readline from "node:readline/promises";
import { isResult, type Result, type Session } from "./types.js";

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

// Keeps asking until the answer is valid, then returns it
async function askResult(rl: readline.Interface): Promise<Result> {
  while (true) {
    const answer = (await rl.question("Whats the result? (yes, no, partly): "))
      .trim()
      .toLowerCase();

    if (isResult(answer)) return answer;

    console.log("Please type yes, no, or partly.");
  }
}

export async function askSession(rl: readline.Interface): Promise<Session> {
  const date = await askWithDefault(rl, "\nWhats the date?: ", today());
  const position = await rl.question("Whats the position?: ");
  const whatYouTried = await rl.question("What did you try?: ");
  const result = await askResult(rl);
  const why = await rl.question("Why do you think that?: ");

  return { date, position, whatYouTried, result, why };
}
