#!/usr/bin/env node

import cfonts from "cfonts";
import { pathToFileURL } from "node:url";
import { rootCommand } from "./app/root.ts";

type CliIo = {
  writeLine: (message: string) => void;
};

const versionArgs = new Set(["--version", "-v", "version"]);

const defaultIo: CliIo = {
  writeLine: console.log,
};

/**
 * Runs the clido command line entrypoint.
 *
 * @param argv - Process-style argument vector.
 * @param io - Output adapter for testable command rendering.
 * @returns The process exit code.
 */
export const runCli = (argv: readonly string[], io: CliIo = defaultIo): number => {
  const [command] = argv.slice(2);

  if (command !== undefined && versionArgs.has(command)) {
    io.writeLine(rootCommand.meta.version);
    return 0;
  }

  cfonts.say(rootCommand.meta.name, {
    font: "block",
    align: "left",
    colors: ["cyan", "blue"],
    space: true,
  });

  io.writeLine(`${rootCommand.meta.description}\n`);
  io.writeLine("使い方は `clido help` を参照してください。");

  return 0;
};

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli(process.argv);
}
