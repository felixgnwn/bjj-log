import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { appendFile } from "node:fs/promises";

type Result = "yes" | "no" | "partly";

type Session = {
  date: string;
  position: string;
  whatYouTried: string;
  result: Result;
  why: string;
};

function isResult(value: string): value is Result {
  return value === "yes" || value === "no" || value === "partly";
}

async function appendData(filePath: string, data: Session) {
  const row =
    Object.values(data)
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(",") + "\n";

  try {
    await appendFile(filePath, row, "utf8");
    console.log("Row Added");
  } catch (err) {
    console.error("Error appending row:", err);
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });

  const date = await rl.question("Whats the date?: ");
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

  const session: Session = {
    date,
    position,
    whatYouTried,
    result,
    why,
  };

  appendData("./src/data/logs.csv", session);

  rl.close();
}

main();
