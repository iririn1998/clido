import type { CommandContext, CommandDef } from "citty";
import type { Io, Output } from "../infra/output.ts";
import { createJsonOutput, createPlainOutput } from "../infra/output.ts";
import { resolveTodosFile } from "../infra/paths.ts";
import { now } from "../infra/system.ts";
import { createJsonTodoRepository } from "../repository/json-todo-repository.ts";
import type { TodoRepository } from "../repository/todo-repository.ts";

/**
 * 各コマンドの `run` が実行時に受け取る依存一式。グローバル状態を持たず、
 * `getContext` 越しに注入する。`now` は値ではなくクロック関数で、コマンドが
 * 一度呼んで得た `Date` を core / repository へ渡す。
 */
export type Context = {
  repo: TodoRepository;
  output: Output;
  now: () => Date;
};

/**
 * `createContext` の入力。`--json` の有無で出力 renderer を切り替える。
 */
export type CreateContextOptions = {
  json: boolean;
};

/**
 * composition root。具体実装（JSON repository・renderer）への依存はここに閉じ込め、
 * `commands` / `core` からは import しない。
 *
 * @param options - `--json` 指定の有無。
 * @param io - 出力先の writer 一式（テストで差し替え可能）。
 * @returns 構築済みの `Context`。
 */
export const createContext = (options: CreateContextOptions, io: Io): Context => {
  const repo = createJsonTodoRepository(resolveTodosFile());
  const output = options.json
    ? createJsonOutput(io.writeOut, io.writeErr)
    : createPlainOutput(io.writeOut, io.writeErr);
  return { repo, output, now };
};

/**
 * citty の実行時 context から `Context` を組み立てる関数。
 */
export type GetContext = (runContext: unknown) => Context;

/**
 * command factory が受け取る依存。`getContext` だけを注入し、各コマンドは実行時に
 * `Context` を取得する。テストでは fake repo / 固定 now を持つ `getContext` を渡す。
 */
export type CommandDeps = {
  getContext: GetContext;
};

/**
 * `defineCommand` の結果（`meta` / `args` / `run`）を返す自己記述コマンドの factory。
 * `registry.ts` に登録するだけでディスパッチと help 自動生成が効く。各コマンドが固有の
 * `args` を持つため、citty の `SubCommandsDef` と同じく型引数は `any` で受ける。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommandFactory = (deps: CommandDeps) => CommandDef<any>;

/**
 * production 用の `getContext` を生成する。subcommand の `args.json` を読んで
 * 出力形式を決める（`--json` は各 subcommand の `args` にも展開して伝播を担保する）。
 * `--json` は root/global option でもあるため、前置き（`clido --json list`）を
 * `cli.ts` が検出した場合は `forceJson` で強制し、指定位置に依らず一貫させる。
 *
 * @param io - 出力先の writer 一式。
 * @param forceJson - root 前置きの `--json` を検出したら `true`。出力形式を強制する。
 * @returns citty の実行時 context から `Context` を作る関数。
 */
export const createGetContext =
  (io: Io, forceJson = false): GetContext =>
  (runContext) => {
    const args = (runContext as CommandContext | undefined)?.args;
    const json = forceJson || Boolean(args?.json);
    return createContext({ json }, io);
  };
