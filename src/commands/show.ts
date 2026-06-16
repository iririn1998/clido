import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";
import { NotFoundError } from "../core/errors.ts";
import { parseId } from "./args.ts";

/**
 * `clido show <id>` — todo 1件の詳細を表示する。
 *
 * positional の `id` を `parseId` で正の整数へ検証し（不正なら `UsageError`、終了コード 2）、
 * repository の `get` で取得する。`get` は存在しなければ `null` を返すため、その場合はコマンド層で
 * `NotFoundError`（終了コード 1）へ変換する。状態は変更しないので `update` ではなく `get` を使う。
 * 結果は `output.todo` で描画する。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns show コマンドの citty 定義。
 */
export const createShowCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "show",
      description: "todo の詳細を表示する",
    },
    args: {
      id: {
        type: "positional",
        description: "表示する todo の id",
      },
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * id を検証して todo を取得し、存在すれば描画する。存在しなければ `NotFoundError`。
     *
     * @param runContext - citty の実行時 context（`args.id` / `args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const id = parseId(runContext.args.id);
      const todo = await ctx.repo.get(id);
      if (todo === null) {
        throw new NotFoundError(`todo が見つかりません: #${id}`);
      }
      ctx.output.todo({ todo });
    },
  });
