#!/usr/bin/env node

import { renderUsage, runCommand } from "citty";
import type { ArgDef, CommandDef } from "citty";
import { pathToFileURL } from "node:url";
import { createGetContext } from "./app/context.ts";
import { prescanJson, reportError } from "./app/exit.ts";
import { runInteractive } from "./app/interactive.ts";
import { createRootCommand, rootMeta } from "./app/root.ts";
import { UsageError } from "./core/errors.ts";
import type { Io } from "./infra/output.ts";
import { logoLines } from "./tui/logo.ts";

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
  io.writeOut(logoLines.join("\n"));
  io.writeOut(`\n${rootMeta.description}\n`);
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
 * Collects the names (and aliases) of value-taking flags (`string` / `enum`) so the
 * positional counter can skip the value token that follows `--flag <value>`.
 *
 * @param command - The resolved subcommand whose declared args are read.
 * @returns The set of value-flag names (without leading dashes).
 */
const collectValueFlags = (command: CommandDef): Set<string> => {
  const valueFlags = new Set<string>();
  const args = command.args as Record<string, ArgDef> | undefined;
  if (args !== undefined) {
    for (const [name, def] of Object.entries(args)) {
      if (def.type !== "string" && def.type !== "enum") {
        continue;
      }
      valueFlags.add(name);
      const alias = (def as { alias?: string | string[] }).alias;
      if (typeof alias === "string") {
        valueFlags.add(alias);
      } else if (Array.isArray(alias)) {
        for (const entry of alias) {
          valueFlags.add(entry);
        }
      }
    }
  }
  return valueFlags;
};

/**
 * Counts the positional args a command declares, i.e. the maximum number of bare
 * (non-flag) tokens it can consume.
 *
 * @param command - The resolved subcommand whose declared args are read.
 * @returns The number of declared positional args.
 */
const countDeclaredPositionals = (command: CommandDef): number => {
  const args = command.args as Record<string, ArgDef> | undefined;
  if (args === undefined) {
    return 0;
  }
  let count = 0;
  for (const def of Object.values(args)) {
    if (def.type === "positional") {
      count += 1;
    }
  }
  return count;
};

/**
 * Rejects extra positional arguments beyond what the command declares. citty
 * silently drops surplus positionals (e.g. `clido add foo bar` keeps only `foo`),
 * which causes silent data loss, so this guard upholds the usage-error contract
 * (exit code 2). Everything after `--` is treated as positional, mirroring citty.
 *
 * @param tokens - The raw argument tokens after the subcommand name.
 * @param valueFlags - Value-taking flag names whose following token is a value.
 * @param max - The number of positional args the command declares.
 */
const assertPositionalArity = (
  tokens: readonly string[],
  valueFlags: Set<string>,
  max: number,
): void => {
  const positionals: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "--") {
      positionals.push(...tokens.slice(i + 1));
      break;
    }
    if (token.startsWith("-") && token !== "-") {
      if (token.includes("=")) {
        continue;
      }
      const name = token.startsWith("--") ? token.slice(2) : token.slice(1);
      if (valueFlags.has(name)) {
        i += 1;
      }
      continue;
    }
    positionals.push(token);
  }
  if (positionals.length > max) {
    const extras = positionals.slice(max).join(" ");
    throw new UsageError(
      max === 0
        ? `余分な引数です: ${extras}`
        : `余分な引数です: ${extras}（このコマンドは引数を ${max} 個までしか受け付けません）`,
    );
  }
};

/** Root が宣言する global option（前置きを許す）の正規化済みトークン集合。 */
const rootOptionTokens = new Set(["--json", "--no-json", "--json=true", "--json=false"]);

/**
 * Finds the index of the command token in the raw args, skipping leading
 * root-level global options (e.g. `clido --json list`). Stops scanning at `--`.
 * Unlike a generic flag skip, only declared root options are skipped so that
 * command-like flags (`--version` / `--help`) are still returned as the command
 * candidate.
 *
 * @param rawArgs - The raw argument tokens (command and beyond).
 * @returns The index of the first command token, or `-1` if none precedes `--`.
 */
const findCommandIndex = (rawArgs: readonly string[]): number => {
  for (let i = 0; i < rawArgs.length; i += 1) {
    const token = rawArgs[i];
    if (token === "--") {
      return -1;
    }
    if (rootOptionTokens.has(token)) {
      continue;
    }
    return i;
  }
  return -1;
};

/**
 * Detects a `--help` / `-h` flag among a subcommand's tokens, stopping at `--`
 * so values after the terminator are not mistaken for the flag.
 *
 * @param tokens - The raw argument tokens after the subcommand name.
 * @returns `true` if help was requested for the subcommand.
 */
const hasHelpFlag = (tokens: readonly string[]): boolean => {
  for (const token of tokens) {
    if (token === "--") {
      break;
    }
    if (token === "--help" || token === "-h") {
      return true;
    }
  }
  return false;
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
  // `--json` is a root/global option, so honor it wherever it appears
  // (`clido --json list` と `clido list --json` の双方で同じ出力形式になる)。
  const jsonFlag = prescanJson(rawArgs);
  const rootCommand = createRootCommand({ getContext: createGetContext(io, jsonFlag) });

  // 先頭の root レベル global option（例 `--json`）を読み飛ばして実コマンドを特定する。
  const commandIndex = findCommandIndex(rawArgs);
  const command = commandIndex === -1 ? undefined : rawArgs[commandIndex];
  const second = commandIndex === -1 ? undefined : rawArgs[commandIndex + 1];

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
    // 端末上なら対話的な todo 一覧を起動する。パイプ等の非 TTY では raw mode が
    // 使えずキー入力も無いため、従来どおりバナーを表示して `clido help` へ誘導する。
    if (process.stdin.isTTY === true && process.stdout.isTTY === true) {
      try {
        await runInteractive(process.stdin, process.stdout);
        return 0;
      } catch (error) {
        // 対話セッション中の I/O 失敗（StorageError 等）も、サブコマンドと同じ
        // `reportError` 集約へ寄せて整形する（生スタックトレースを出さない）。
        // 対話モードは plain 固定のため json は常に false。
        return reportError(error, { json: false, io });
      }
    }
    showBanner(io);
    return 0;
  }

  try {
    const subCommands = rootCommand.subCommands as Record<string, CommandDef> | undefined;
    const matched = subCommands?.[command];
    const subTokens = rawArgs.slice(commandIndex + 1);
    if (matched !== undefined) {
      // `clido <command> --help|-h` を dispatch 前に処理し、usage を出して終了コード 0。
      if (hasHelpFlag(subTokens)) {
        io.writeOut(await renderUsage(matched, rootCommand));
        return 0;
      }
      assertKnownFlags(subTokens, collectAllowedFlags(matched));
      assertPositionalArity(
        subTokens,
        collectValueFlags(matched),
        countDeclaredPositionals(matched),
      );
    }
    // root レベルフラグを取り除き、citty には `<command> ...` 形式で渡す。
    await runCommand(rootCommand, { rawArgs: rawArgs.slice(commandIndex) });
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
