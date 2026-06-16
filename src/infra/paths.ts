import { homedir } from "node:os";
import { join } from "node:path";

/**
 * データディレクトリを解決する。優先順は `CLIDO_DATA_DIR`（テスト / CI 用の上書き）→
 * `$XDG_DATA_HOME/clido` → `~/.local/share/clido`。
 *
 * @param env - 参照する環境変数（テストで差し替え可能）。
 * @returns データディレクトリの絶対パス。
 */
export const resolveDataDir = (env: NodeJS.ProcessEnv = process.env): string => {
  const override = env.CLIDO_DATA_DIR;
  if (override !== undefined && override.length > 0) {
    return override;
  }
  const xdg = env.XDG_DATA_HOME;
  const base = xdg !== undefined && xdg.length > 0 ? xdg : join(homedir(), ".local", "share");
  return join(base, "clido");
};

/**
 * 永続化ファイル `todos.json` の絶対パスを解決する。
 *
 * @param env - 参照する環境変数（テストで差し替え可能）。
 * @returns `todos.json` の絶対パス。
 */
export const resolveTodosFile = (env: NodeJS.ProcessEnv = process.env): string =>
  join(resolveDataDir(env), "todos.json");
