import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";
import { UsageError } from "../core/errors.ts";
import type { TodoStatus } from "../core/todo.ts";

/**
 * `clido list` — todo を一覧表示する。
 *
 * 引数を repository の `filter` へ写像する: 無指定は未完了のみ（`{ status: "open" }`）、
 * `--all` は全件（filter 無し）、`--status <open|done>` は対応する状態で絞り込む。
 * `--all` と `--status` の同時指定は `UsageError`。`status` の enum 検証は citty に委ねる。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns list コマンドの citty 定義。
 */
export const createListCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "list",
      description: "todo を一覧表示する",
    },
    args: {
      all: {
        type: "boolean",
        description: "完了済みも含めて全件表示する",
        default: false,
      },
      status: {
        type: "enum",
        options: ["open", "done"],
        description: "状態で絞り込む（open / done）",
      },
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * 引数を repository の `filter` へ写像して一覧を取得し、描画する。
     *
     * @param runContext - citty の実行時 context（`args.all` / `args.status` / `args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const { all, status } = runContext.args;
      if (all && status !== undefined) {
        throw new UsageError("--all と --status は同時に指定できません。");
      }
      const filter = all ? undefined : { status: (status ?? "open") as TodoStatus };
      const todos = await ctx.repo.list(filter);
      ctx.output.todoList({ todos });
    },
  });
