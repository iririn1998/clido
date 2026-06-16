import type { Todo, TodoStatus } from "../core/todo.ts";

/**
 * Todo の変更単位を表す永続化インターフェース。コマンドはこの契約にのみ依存し、
 * JSON / SQLite などの具体実装や `nextId`・ファイル構造を知らない。
 */
export interface TodoRepository {
  /**
   * 条件に合う todo を `id` 昇順で返す。`filter.status` 未指定なら全件。
   */
  list(filter?: { status?: TodoStatus }): Promise<Todo[]>;

  /**
   * `id` の todo を返す。存在しなければ throw せず `null` を返す。
   */
  get(id: number): Promise<Todo | null>;

  /**
   * 新しい todo を採番して保存する。`createdAt` / `updatedAt` は `now` から設定する。
   */
  add(input: { title: string; now: Date }): Promise<Todo>;

  /**
   * `id` の todo に `change` を適用して保存する。タイムスタンプ更新は呼び出し側が
   * `core` の純粋関数で済ませてから渡す。存在しなければ `NotFoundError` を throw する。
   */
  update(id: number, change: (todo: Todo) => Todo): Promise<Todo>;

  /**
   * `id` の todo を削除する。存在しなければ `NotFoundError` を throw する。
   */
  delete(id: number): Promise<void>;
}
