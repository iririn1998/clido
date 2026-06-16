import type { Todo, TodoStatus } from "../core/todo.ts";
import type { TuiState } from "./state.ts";

/** 画面下部に常時表示する操作ガイド。 */
export const helpLine = "↑/↓ (j/k): 移動   Enter/Space: 完了切替   q: 終了";

/**
 * 状態を1文字のマーク（done は `x`、open は空白）へ変換する。
 *
 * @param status - todo の状態。
 * @returns チェックボックス内に表示する1文字。
 */
const statusMark = (status: TodoStatus): string => (status === "done" ? "x" : " ");

/**
 * Todo 1件を対話モードの1行へ整形する純粋関数。フォーカス中は先頭に `>` を、
 * それ以外は空白を置き、`#id [x] title` 形式の本文を続ける。
 *
 * @param todo - 整形対象の Todo。
 * @param focused - その行が現在フォーカスされているか。
 * @returns 表示用の1行文字列。
 */
export const renderRow = (todo: Todo, focused: boolean): string => {
  const pointer = focused ? ">" : " ";
  return `${pointer} #${todo.id} [${statusMark(todo.status)}] ${todo.title}`;
};

/**
 * 画面全体を行配列へ整形する純粋関数。ヘッダ・各行・操作ガイドを組み立てる。
 * 空リストなら案内文を出す。driver はこの戻り値を改行で連結して描画するだけで、
 * 整形ロジックは I/O から独立して単体テストできる。
 *
 * @param state - 描画する画面状態。
 * @returns 画面に出力する行の配列。
 */
export const renderFrame = (state: TuiState): string[] => {
  const header = ["clido — todo 一覧", ""];
  const body =
    state.todos.length === 0
      ? ["todo はありません。"]
      : state.todos.map((todo, index) => renderRow(todo, index === state.focus));
  return [...header, ...body, "", helpLine];
};
