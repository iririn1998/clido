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

/**
 * todo を完了済みにする純粋関数。`status` を `done`、`completedAt` / `updatedAt` を
 * `now` に設定する。既に `done` なら `completedAt` を保ったまま同一オブジェクトを返し、
 * 完了時刻の上書きを避ける（done コマンドは冪等）。
 *
 * @param todo - 遷移元の Todo。
 * @param now - 遷移時刻。
 * @returns 完了済みの Todo（既に完了なら入力をそのまま返す）。
 */
export const complete = (todo: Todo, now: Date): Todo => {
  if (todo.status === "done") {
    return todo;
  }
  const timestamp = now.toISOString();
  return { ...todo, status: "done", completedAt: timestamp, updatedAt: timestamp };
};

/**
 * todo を未完了に戻す純粋関数。`status` を `open`、`completedAt` を `null`、
 * `updatedAt` を `now` に設定する。既に `open` なら同一オブジェクトを返す（reopen は冪等）。
 *
 * @param todo - 遷移元の Todo。
 * @param now - 遷移時刻。
 * @returns 未完了の Todo（既に未完了なら入力をそのまま返す）。
 */
export const reopen = (todo: Todo, now: Date): Todo => {
  if (todo.status === "open") {
    return todo;
  }
  return { ...todo, status: "open", completedAt: null, updatedAt: now.toISOString() };
};

/**
 * todo のタイトルを変更する純粋関数。`title` を差し替え、`updatedAt` を `now` に設定する。
 * `title` は trim・非空検査をコマンド層で済ませた値を受け取る前提（本関数では検査しない）。
 * 変更後のタイトルが現在と同一なら同一オブジェクトを返し、`updatedAt` の無意味な更新を避ける
 * （edit は冪等）。`status` / `completedAt` は変更しない。
 *
 * @param todo - 変更元の Todo。
 * @param title - 新しいタイトル（trim 済みの非空文字列）。
 * @param now - 変更時刻。
 * @returns タイトル変更後の Todo（変更がなければ入力をそのまま返す）。
 */
export const rename = (todo: Todo, title: string, now: Date): Todo => {
  if (todo.title === title) {
    return todo;
  }
  return { ...todo, title, updatedAt: now.toISOString() };
};
