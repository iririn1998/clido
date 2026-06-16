import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";
import { reopen } from "../core/todo.ts";
import { parseId } from "./args.ts";

/**
 * `clido reopen <id>` — 完了済み todo を未完了に戻す。
 *
 * positional の `id` を `parseId` で正の整数へ検証し（不正なら `UsageError`、終了コード 2）、
 * repository の `update` に core の純粋関数 `reopen` を渡して状態遷移させる。
 * 対象が存在しなければ repository が `NotFoundError` を throw する。結果は `output.todo` で描画する。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns reopen コマンドの citty 定義。
 */
export const createReopenCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "reopen",
      description: "完了済み todo を未完了に戻す",
    },
    args: {
      id: {
        type: "positional",
        description: "未完了に戻す todo の id",
      },
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * id を検証し、`reopen` を適用して todo を未完了に戻して描画する。
     *
     * @param runContext - citty の実行時 context（`args.id` / `args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const id = parseId(runContext.args.id);
      const now = ctx.now();
      const todo = await ctx.repo.update(id, (current) => reopen(current, now));
      ctx.output.todo({ todo });
    },
  });
