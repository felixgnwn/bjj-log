import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function main() {
  const rl = readline.createInterface({ input, output });

  const name = await rl.question("Whats your name?: ");
  console.log(name);

  rl.close();
}

main();
