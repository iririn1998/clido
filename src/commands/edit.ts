import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";
import { rename } from "../core/todo.ts";
import { parseId, validateTitle } from "./args.ts";

/**
 * `clido edit <id> <title>` — todo のタイトルを変更する。
 *
 * positional の `id` を `parseId` で正の整数へ検証し（不正なら `UsageError`、終了コード 2）、
 * `title` は trim 後に非空であることをコマンド層で検査する（空なら `UsageError`）。検証済みの
 * title を core の純粋関数 `rename` で適用し、repository の `update` で保存する。対象が存在しなければ
 * repository が `NotFoundError` を throw する。結果は `output.todo` で描画する。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns edit コマンドの citty 定義。
 */
export const createEditCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "edit",
      description: "todo のタイトルを変更する",
    },
    args: {
      id: {
        type: "positional",
        description: "変更する todo の id",
      },
      title: {
        type: "positional",
        description: "新しいタイトル",
      },
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * id を検証し、trim・検査した title を `rename` で適用して todo を更新・描画する。
     *
     * @param runContext - citty の実行時 context（`args.id` / `args.title` / `args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const id = parseId(runContext.args.id);
      const title = validateTitle(
        runContext.args.title,
        "title が空です。新しいタイトルを指定してください。",
      );
      const now = ctx.now();
      const todo = await ctx.repo.update(id, (current) => rename(current, title, now));
      ctx.output.todo({ todo });
    },
  });
