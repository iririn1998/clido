import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";

/**
 * `clido clear` — 完了済みの todo を一括削除する。
 *
 * repository の `deleteCompleted` で `done` 状態の todo をまとめて削除し、削除件数を
 * 受け取る。対象が無くてもエラーにせず `0` 件として扱う（一括削除は冪等）。結果は
 * `output.success({ cleared: count })` で描画する。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns clear コマンドの citty 定義。
 */
export const createClearCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "clear",
      description: "完了済みの todo を一括削除する",
    },
    args: {
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * 完了済みの todo を一括削除し、削除件数を描画する。
     *
     * @param runContext - citty の実行時 context（`args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const cleared = await ctx.repo.deleteCompleted();
      ctx.output.success({ cleared });
    },
  });
