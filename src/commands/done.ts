import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";
import { complete } from "../core/todo.ts";
import { parseId } from "./args.ts";

/**
 * `clido done <id>` — todo を完了済みにする。
 *
 * positional の `id` を `parseId` で正の整数へ検証し（不正なら `UsageError`、終了コード 2）、
 * repository の `update` に core の純粋関数 `complete` を渡して状態遷移させる。
 * 対象が存在しなければ repository が `NotFoundError` を throw する。結果は `output.todo` で描画する。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns done コマンドの citty 定義。
 */
export const createDoneCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "done",
      description: "todo を完了済みにする",
    },
    args: {
      id: {
        type: "positional",
        description: "完了にする todo の id",
      },
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * id を検証し、`complete` を適用して todo を完了済みにして描画する。
     *
     * @param runContext - citty の実行時 context（`args.id` / `args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const id = parseId(runContext.args.id);
      const now = ctx.now();
      const todo = await ctx.repo.update(id, (current) => complete(current, now));
      ctx.output.todo({ todo });
    },
  });
