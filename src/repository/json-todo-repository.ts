import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { NotFoundError, StorageError } from "../core/errors.ts";
import type { Todo, TodoStatus } from "../core/todo.ts";
import type { TodoRepository } from "./todo-repository.ts";
import {
  assertStorageInvariants,
  emptyStorage,
  normalizeNextId,
  parseStorage,
  type StorageFile,
} from "./schema.ts";

/**
 * Node の errno 例外（`code` を持つ `Error`）か判定する。
 *
 * @param error - 判定対象。
 * @returns errno 例外なら `true`。
 */
const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

/**
 * `TodoRepository` の JSON ファイル実装を生成する。各メソッドは内部で
 * `load → mutate → save` を完結させ、保存はアトミック書き込み（temp + rename）で行う。
 *
 * @param filePath - `todos.json` の絶対パス。
 * @returns JSON ファイル実装の `TodoRepository`。
 */
export const createJsonTodoRepository = (filePath: string): TodoRepository => {
  /**
   * 永続化ファイルを読み込んで検証する。存在しなければ空状態を返す。
   * `nextId` は読み込み時にメモリ上で補正するが、ディスクには書き戻さない。
   *
   * @returns 検証・補正済みの状態。
   */
  const load = async (): Promise<StorageFile> => {
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return emptyStorage();
      }
      throw new StorageError(
        `todo ファイルを読み込めません: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new StorageError(
        `todo ファイルの JSON を解析できません: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return normalizeNextId(parseStorage(parsed));
  };

  /**
   * 検証済みの状態をアトミックに保存する。親ディレクトリを作成し、一時ファイルへ
   * 書いてから `rename` で差し替える。失敗時は可能な範囲で一時ファイルを削除する。
   *
   * @param storage - 保存する検証済みの状態。
   */
  const save = async (storage: StorageFile): Promise<void> => {
    assertStorageInvariants(storage);

    const dir = dirname(filePath);
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    const body = `${JSON.stringify(storage, null, 2)}\n`;

    try {
      await mkdir(dir, { recursive: true, mode: 0o700 });
      await writeFile(tmpPath, body, { mode: 0o600 });
      await rename(tmpPath, filePath);
    } catch (error) {
      try {
        await unlink(tmpPath);
      } catch {
        // 一時ファイルが無い等のクリーンアップ失敗は無視する。
      }
      throw new StorageError(
        `todo ファイルを保存できません: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  /**
   * `id` 昇順の比較関数。
   *
   * @param a - 比較対象の Todo。
   * @param b - 比較対象の Todo。
   * @returns `a.id - b.id`。
   */
  const byId = (a: Todo, b: Todo): number => a.id - b.id;

  return {
    /**
     * 条件に合う todo を `id` 昇順で返す。
     *
     * @param filter - 任意の状態フィルタ。
     * @returns 条件に合う Todo の配列。
     */
    list: async (filter?: { status?: TodoStatus }): Promise<Todo[]> => {
      const storage = await load();
      const status = filter?.status;
      const todos =
        status === undefined
          ? storage.todos
          : storage.todos.filter((todo) => todo.status === status);
      return [...todos].sort(byId);
    },

    /**
     * `id` の todo を返す。存在しなければ `null`。
     *
     * @param id - 取得する todo の id。
     * @returns 該当 Todo または `null`。
     */
    get: async (id: number): Promise<Todo | null> => {
      const storage = await load();
      return storage.todos.find((todo) => todo.id === id) ?? null;
    },

    /**
     * 新しい todo を採番して保存する。
     *
     * @param input - 追加する title と作成時刻。
     * @returns 採番・保存された Todo。
     */
    add: async (input: { title: string; now: Date }): Promise<Todo> => {
      const storage = await load();
      const timestamp = input.now.toISOString();
      const todo: Todo = {
        id: storage.nextId,
        title: input.title,
        status: "open",
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
      };
      const next: StorageFile = {
        ...storage,
        nextId: storage.nextId + 1,
        todos: [...storage.todos, todo],
      };
      await save(next);
      return todo;
    },

    /**
     * `id` の todo に `change` を適用して保存する。存在しなければ `NotFoundError`。
     *
     * @param id - 更新対象の id。
     * @param change - 現在の Todo から新しい Todo を作る純粋関数。
     * @returns 更新後の Todo。
     */
    update: async (id: number, change: (todo: Todo) => Todo): Promise<Todo> => {
      const storage = await load();
      const index = storage.todos.findIndex((todo) => todo.id === id);
      if (index === -1) {
        throw new NotFoundError(`todo が見つかりません: #${id}`);
      }
      const current = storage.todos[index];
      const updated = change(current);
      if (updated.id !== current.id || updated.createdAt !== current.createdAt) {
        throw new StorageError(`update は id / createdAt を変更できません: #${id}`);
      }
      const todos = [...storage.todos];
      todos[index] = updated;
      await save({ ...storage, todos });
      return updated;
    },

    /**
     * `id` の todo を削除する。存在しなければ `NotFoundError`。
     *
     * @param id - 削除対象の id。
     */
    delete: async (id: number): Promise<void> => {
      const storage = await load();
      const exists = storage.todos.some((todo) => todo.id === id);
      if (!exists) {
        throw new NotFoundError(`todo が見つかりません: #${id}`);
      }
      const todos = storage.todos.filter((todo) => todo.id !== id);
      await save({ ...storage, todos });
    },
  };
};
