#!/usr/bin/env node

import cfonts from "cfonts";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

const [command] = process.argv.slice(2);

if (command === "--version" || command === "-v" || command === "version") {
  console.log(packageJson.version);
  process.exit(0);
}

cfonts.say("clido", {
  font: "block",
  align: "left",
  colors: ["cyan", "blue"],
  space: true,
});

console.log("ローカルファーストな todo 管理 CLI\n");
