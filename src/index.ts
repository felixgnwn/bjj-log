import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type Session = {
  date: string;
  position: string;
  whatYouTried: string;
  result: string;
  why: string;
};

async function main() {
  const rl = readline.createInterface({ input, output });

  const date = await rl.question("Whats the date?: ");
  const position = await rl.question("Whats the position?: ");
  const whatYouTried = await rl.question("What did you try?: ");
  const result = await rl.question("Whats the result? (yes, no, partly): ");
  const why = await rl.question("Why do you think that?: ");

  const session: Session = {
    date,
    position,
    whatYouTried,
    result,
    why,
  };

  console.log(session);

  rl.close();
}

main();
