import { defineCommand } from "citty";
import type { CommandFactory } from "../app/context.ts";
import { validateTitle } from "./args.ts";

/**
 * `clido add <title>` — 新しい todo を追加する。
 *
 * title は trim 後に非空であることをコマンド層で検査し、空なら `UsageError`（終了コード 2）。
 * 採番・タイムスタンプ設定は repository が担い、結果の Todo を `output.todo` で描画する。
 *
 * @param deps - command factory の依存（`getContext`）。
 * @returns add コマンドの citty 定義。
 */
export const createAddCommand: CommandFactory = (deps) =>
  defineCommand({
    meta: {
      name: "add",
      description: "todo を追加する",
    },
    args: {
      title: {
        type: "positional",
        description: "todo のタイトル",
      },
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    /**
     * title を trim・検査して repository へ追加し、結果の Todo を描画する。
     *
     * @param runContext - citty の実行時 context（`args.title` / `args.json` を含む）。
     */
    run: async (runContext) => {
      const ctx = deps.getContext(runContext);
      const title = validateTitle(
        runContext.args.title,
        "title が空です。タイトルを指定してください。",
      );
      const todo = await ctx.repo.add({ title, now: ctx.now() });
      ctx.output.todo({ todo });
    },
  });
