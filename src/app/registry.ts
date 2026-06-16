import { createAddCommand } from "../commands/add.ts";
import { createListCommand } from "../commands/list.ts";
import type { CommandFactory } from "./context.ts";

/**
 * コマンド factory のレジストリ。新コマンドはここに1行追加するだけで、`root.ts` が
 * `subCommands` を構築し、ディスパッチと help 自動生成の両方が効く。
 *
 * `help` / `version` は registry を持たず `cli.ts` が特別処理する（終了コード契約のため）。
 */
export const registry: Record<string, CommandFactory> = {
  add: createAddCommand,
  list: createListCommand,
};
