#!/usr/bin/env node

import cfonts from "cfonts";
import { renderUsage, runCommand } from "citty";
import { pathToFileURL } from "node:url";
import { rootCommand, rootMeta } from "./app/root.ts";

type CliIo = {
  writeLine: (message: string) => void;
};

const versionArgs = new Set(["--version", "-v", "version"]);
const helpArgs = new Set(["--help", "-h", "help"]);

const defaultIo: CliIo = {
  writeLine: console.log,
};

/**
 * Renders the bare `clido` startup banner and points users at `clido help`.
 *
 * @param io - Output adapter for testable command rendering.
 */
const showBanner = (io: CliIo): void => {
  cfonts.say(rootMeta.name, {
    font: "block",
    align: "left",
    colors: ["cyan", "blue"],
    space: true,
  });

  io.writeLine(`${rootMeta.description}\n`);
  io.writeLine("使い方は `clido help` を参照してください。");
};

/**
 * Runs the clido command line entrypoint.
 *
 * `--version` / `--help` and their `version` / `help` subcommand aliases are
 * handled explicitly rather than relying on citty's built-in flags, so exit
 * codes and output stay under our control. Anything else is dispatched through
 * citty's `runCommand` against the root command's subcommand registry.
 *
 * @param argv - Process-style argument vector.
 * @param io - Output adapter for testable command rendering.
 * @returns The process exit code.
 */
export const runCli = async (argv: readonly string[], io: CliIo = defaultIo): Promise<number> => {
  const rawArgs = argv.slice(2);
  const [command] = rawArgs;

  if (command !== undefined && versionArgs.has(command)) {
    io.writeLine(rootMeta.version);
    return 0;
  }

  if (command !== undefined && helpArgs.has(command)) {
    io.writeLine(await renderUsage(rootCommand));
    return 0;
  }

  if (command === undefined) {
    showBanner(io);
    return 0;
  }

  await runCommand(rootCommand, { rawArgs });
  return 0;
};

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv)
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
