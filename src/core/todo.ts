/**
 * Todo の状態。`open`（未完了）と `done`（完了）の2値のみ。
 */
export type TodoStatus = "open" | "done";

/**
 * Todo のドメインモデル。永続化形式とアプリ内表現を兼ねる素のデータ型。
 *
 * - `id` は単調増加の連番（削除しても再利用しない）。
 * - `title` は trim 済みの非空文字列。
 * - 時刻はすべて ISO 8601 文字列。`completedAt` は未完了なら `null`。
 *
 * 状態遷移（`open ⇄ done`）やタイトル変更は I/O に触れない純粋関数として
 * 本ファイルに追加していく。`add` / `list` では型のみを参照する。
 */
export type Todo = {
  id: number;
  title: string;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
