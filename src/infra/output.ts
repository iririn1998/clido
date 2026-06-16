import type { Todo, TodoStatus } from "../core/todo.ts";

/**
 * エラー以外の標準出力 / エラー出力を1行ずつ書く writer。改行は呼び出し側が付けない。
 */
export type OutputWriter = (message: string) => void;

/**
 * 標準出力とエラー出力の writer 一式。production では process ストリーム、テストでは
 * 行を捕捉する関数を注入する。`createContext` と `app/exit.ts` が共通で受け取る。
 */
export type Io = {
  writeOut: OutputWriter;
  writeErr: OutputWriter;
};

/**
 * `--json` 出力で返すエラー payload。`code` はエラー種別名（USAGE / STORAGE 等）。
 */
export type ErrorPayload = {
  code: string;
  message: string;
};

/**
 * コマンドが描画に使う出力契約。コマンド層は renderer 実装を知らず、この型越しに
 * response DTO を渡す。plain / json の2実装があり、テストでは出力を捕捉する fake を注入する。
 */
export type Output = {
  /** Todo 単体（add / done / reopen / edit / show）。 */
  todo: (dto: { todo: Todo }) => void;
  /** Todo 一覧（list）。 */
  todoList: (dto: { todos: Todo[] }) => void;
  /** Todo を直接返さない成功応答（delete の削除結果など）。 */
  success: (dto: Record<string, unknown>) => void;
  /** 全コマンド共通の異常時出力。 */
  error: (error: ErrorPayload) => void;
};

/**
 * 状態を1文字のマーク（done は `x`、open は空白）へ変換する。
 *
 * @param status - todo の状態。
 * @returns チェックボックス内に表示する1文字。
 */
const statusMark = (status: TodoStatus): string => (status === "done" ? "x" : " ");

/**
 * Todo 1件を plain 表示の1行（`#id [x] title`）へ整形する。
 *
 * @param todo - 整形対象の Todo。
 * @returns 表示用の1行文字列。
 */
const renderTodoLine = (todo: Todo): string =>
  `#${todo.id} [${statusMark(todo.status)}] ${todo.title}`;

/**
 * 人間向けの plain テキスト出力を生成する。正常出力は `writeOut`、エラーは `writeErr` へ流す。
 *
 * @param writeOut - 正常出力の writer。
 * @param writeErr - エラー出力の writer。
 * @returns plain renderer の `Output`。
 */
export const createPlainOutput = (writeOut: OutputWriter, writeErr: OutputWriter): Output => ({
  /**
   * Todo 単体を1行で表示する。
   *
   * @param dto - 表示する Todo を包む DTO。
   */
  todo: (dto) => {
    writeOut(renderTodoLine(dto.todo));
  },
  /**
   * Todo 一覧を行ごとに表示する。空なら案内文を1行出す。
   *
   * @param dto - 表示する Todo 配列を包む DTO。
   */
  todoList: (dto) => {
    if (dto.todos.length === 0) {
      writeOut("todo はありません。");
      return;
    }
    for (const todo of dto.todos) {
      writeOut(renderTodoLine(todo));
    }
  },
  /**
   * Todo を直接返さない成功応答を表示する。`deleted` を持つ場合は削除メッセージにする。
   *
   * @param dto - 成功応答の DTO。
   */
  success: (dto) => {
    if (typeof dto.deleted === "number") {
      writeOut(`#${dto.deleted} を削除しました。`);
      return;
    }
    writeOut(JSON.stringify(dto));
  },
  /**
   * エラーを短いメッセージとして表示する。
   *
   * @param error - エラー payload（`message` を表示）。
   */
  error: (error) => {
    writeErr(`エラー: ${error.message}`);
  },
});

/**
 * 機械可読な `--json` 出力を生成する。各 DTO を公開契約として1行 JSON で返す。
 * エラーはすべて `{ "error": { code, message } }` 形式で `writeErr` へ流す。
 *
 * @param writeOut - 正常出力の writer。
 * @param writeErr - エラー出力の writer。
 * @returns JSON renderer の `Output`。
 */
export const createJsonOutput = (writeOut: OutputWriter, writeErr: OutputWriter): Output => ({
  /**
   * Todo 単体 DTO を1行 JSON で出力する。
   *
   * @param dto - `{ todo }` DTO。
   */
  todo: (dto) => {
    writeOut(JSON.stringify(dto));
  },
  /**
   * Todo 一覧 DTO を1行 JSON で出力する。
   *
   * @param dto - `{ todos }` DTO。
   */
  todoList: (dto) => {
    writeOut(JSON.stringify(dto));
  },
  /**
   * 成功応答 DTO を1行 JSON で出力する。
   *
   * @param dto - 任意の成功応答 DTO。
   */
  success: (dto) => {
    writeOut(JSON.stringify(dto));
  },
  /**
   * エラーを `{ error }` 形式の1行 JSON で出力する。
   *
   * @param error - エラー payload。
   */
  error: (error) => {
    writeErr(JSON.stringify({ error }));
  },
});
