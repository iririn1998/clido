import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";
import { parseId } from "./args.ts";

/**
 * `clido delete <id>` — todo を削除する。
 *
 * positional の `id` を `parseId` で正の整数へ検証し（不正なら `UsageError`、終了コード 2）、
 * repository の `delete` で削除する。対象が存在しなければ repository が `NotFoundError` を throw する。
 * 削除は Todo を返さないため、結果は `output.success({ deleted: id })` で描画する。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns delete コマンドの citty 定義。
 */
export const createDeleteCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "delete",
      description: "todo を削除する",
    },
    args: {
      id: {
        type: "positional",
        description: "削除する todo の id",
      },
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * id を検証して todo を削除し、削除結果を描画する。
     *
     * @param runContext - citty の実行時 context（`args.id` / `args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const id = parseId(runContext.args.id);
      await ctx.repo.delete(id);
      ctx.output.success({ deleted: id });
    },
  });
