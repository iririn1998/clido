#!/usr/bin/env node

import cfonts from "cfonts";
import { renderUsage, runCommand } from "citty";
import type { ArgDef, CommandDef } from "citty";
import { pathToFileURL } from "node:url";
import { createGetContext } from "./app/context.ts";
import { prescanJson, reportError } from "./app/exit.ts";
import { createRootCommand, rootMeta } from "./app/root.ts";
import { UsageError } from "./core/errors.ts";
import type { Io } from "./infra/output.ts";

const versionArgs = new Set(["--version", "-v", "version"]);
const helpArgs = new Set(["--help", "-h", "help"]);

const defaultIo: Io = {
  /**
   * 標準出力へ1行書き込む。
   *
   * @param message - 改行なしの1行。
   */
  writeOut: (message) => {
    process.stdout.write(`${message}\n`);
  },
  /**
   * 標準エラー出力へ1行書き込む。
   *
   * @param message - 改行なしの1行。
   */
  writeErr: (message) => {
    process.stderr.write(`${message}\n`);
  },
};

/**
 * Renders the bare `clido` startup banner and points users at `clido help`.
 *
 * @param io - Output adapter for testable command rendering.
 */
const showBanner = (io: Io): void => {
  cfonts.say(rootMeta.name, {
    font: "block",
    align: "left",
    colors: ["cyan", "blue"],
    space: true,
  });

  io.writeOut(`${rootMeta.description}\n`);
  io.writeOut("使い方は `clido help` を参照してください。");
};

/**
 * Collects the option names (and aliases) a subcommand accepts, plus the shared
 * `--json` / `--help` flags, so unknown flags can be rejected before dispatch.
 *
 * @param command - The resolved subcommand whose declared args are read.
 * @returns The set of accepted flag names (without leading dashes).
 */
const collectAllowedFlags = (command: CommandDef): Set<string> => {
  const allowed = new Set<string>(["json", "help", "h"]);
  const args = command.args as Record<string, ArgDef> | undefined;
  if (args !== undefined) {
    for (const [name, def] of Object.entries(args)) {
      if (def.type === "positional") {
        continue;
      }
      allowed.add(name);
      const alias = (def as { alias?: string | string[] }).alias;
      if (typeof alias === "string") {
        allowed.add(alias);
      } else if (Array.isArray(alias)) {
        for (const entry of alias) {
          allowed.add(entry);
        }
      }
    }
  }
  return allowed;
};

/**
 * Rejects `--flag` / `-f` tokens not declared by the resolved command. Positional
 * values after `--` are out of scope. citty silently ignores unknown flags, so this
 * guard upholds the architecture's usage-error contract (exit code 2).
 *
 * @param tokens - The raw argument tokens after the subcommand name.
 * @param allowed - The set of accepted flag names from {@link collectAllowedFlags}.
 */
const assertKnownFlags = (tokens: readonly string[], allowed: Set<string>): void => {
  for (const token of tokens) {
    if (token === "--") {
      break;
    }
    if (!token.startsWith("-") || token === "-") {
      continue;
    }
    let name = token.startsWith("--") ? token.slice(2) : token.slice(1);
    name = name.split("=")[0];
    if (token.startsWith("--no-")) {
      name = name.slice(3);
    }
    if (name.length > 0 && !allowed.has(name)) {
      throw new UsageError(`未知のオプションです: ${token}`);
    }
  }
};

/**
 * Runs the clido command line entrypoint.
 *
 * `--version` / `--help` and their `version` / `help` subcommand aliases are
 * handled explicitly rather than relying on citty's built-in flags, so exit
 * codes and output stay under our control. Anything else is dispatched through
 * citty's `runCommand`, with all errors funneled into `app/exit.ts` for exit-code
 * and (plain | JSON) error formatting.
 *
 * @param argv - Process-style argument vector.
 * @param io - Output adapter for testable command rendering.
 * @returns The process exit code.
 */
export const runCli = async (argv: readonly string[], io: Io = defaultIo): Promise<number> => {
  const rawArgs = argv.slice(2);
  const [command, second] = rawArgs;
  const rootCommand = createRootCommand({ getContext: createGetContext(io) });

  if (command !== undefined && versionArgs.has(command)) {
    io.writeOut(rootMeta.version);
    return 0;
  }

  if (command !== undefined && helpArgs.has(command)) {
    const subCommands = rootCommand.subCommands as Record<string, CommandDef> | undefined;
    const target = second !== undefined ? subCommands?.[second] : undefined;
    io.writeOut(
      target !== undefined
        ? await renderUsage(target, rootCommand)
        : await renderUsage(rootCommand),
    );
    return 0;
  }

  if (command === undefined) {
    showBanner(io);
    return 0;
  }

  try {
    const subCommands = rootCommand.subCommands as Record<string, CommandDef> | undefined;
    const matched = subCommands?.[command];
    if (matched !== undefined) {
      assertKnownFlags(rawArgs.slice(1), collectAllowedFlags(matched));
    }
    await runCommand(rootCommand, { rawArgs });
    return 0;
  } catch (error) {
    return reportError(error, { json: prescanJson(rawArgs), io });
  }
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
