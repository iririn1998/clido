import { createAddCommand } from "../commands/add.ts";
import { createClearCommand } from "../commands/clear.ts";
import { createDeleteCommand } from "../commands/delete.ts";
import { createDoneCommand } from "../commands/done.ts";
import { createEditCommand } from "../commands/edit.ts";
import { createListCommand } from "../commands/list.ts";
import { createReopenCommand } from "../commands/reopen.ts";
import { createShowCommand } from "../commands/show.ts";
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
  done: createDoneCommand,
  reopen: createReopenCommand,
  edit: createEditCommand,
  show: createShowCommand,
  delete: createDeleteCommand,
  clear: createClearCommand,
};
