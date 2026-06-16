import { resolveTodosFile } from "../infra/paths.ts";
import { now } from "../infra/system.ts";
import { createJsonTodoRepository } from "../repository/json-todo-repository.ts";
import { runSession, type InputStream, type OutputStream } from "../tui/session.ts";

/**
 * 対話セッションの composition root。素の `clido` 起動時に呼ばれ、JSON repository
 * とクロックを束ねて {@link runSession} へ渡す。具体実装（JSON repository）への依存は
 * ここに閉じ込め、`cli.ts` は端末ストリームを渡すだけにする。
 *
 * @param input - 端末入力ストリーム（通常は `process.stdin`）。
 * @param output - 端末出力ストリーム（通常は `process.stdout`）。
 */
export const runInteractive = async (input: InputStream, output: OutputStream): Promise<void> => {
  const repo = createJsonTodoRepository(resolveTodosFile());
  await runSession({ repo, now, input, output });
};
