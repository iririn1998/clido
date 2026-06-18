import type { Todo, TodoStatus } from "../core/todo.ts";
import { isQuitFocused, type TuiState } from "./state.ts";

/** 末尾の「終了」項目のラベル。 */
export const QUIT_LABEL = "[ 終了 ]";

/** 画面下部に常時表示する操作ガイド。Enter / Space はフォーカス中の項目を選択する。 */
export const helpLine = "↑/↓ (j/k): 移動   Enter/Space: 選択   q: 終了";

/**
 * 状態を1文字のマーク（done は `x`、open は空白）へ変換する。
 *
 * @param status - todo の状態。
 * @returns チェックボックス内に表示する1文字。
 */
const statusMark = (status: TodoStatus): string => (status === "done" ? "x" : " ");

/**
 * フォーカス状態に応じた行頭のポインタ（フォーカス中は `>`、それ以外は空白）。
 *
 * @param focused - その行が現在フォーカスされているか。
 * @returns 行頭に置く1文字。
 */
const pointer = (focused: boolean): string => (focused ? ">" : " ");

/**
 * Todo 1件を対話モードの1行へ整形する純粋関数。フォーカス中は先頭に `>` を、
 * それ以外は空白を置き、`#id [x] title` 形式の本文を続ける。
 *
 * @param todo - 整形対象の Todo。
 * @param focused - その行が現在フォーカスされているか。
 * @returns 表示用の1行文字列。
 */
export const renderRow = (todo: Todo, focused: boolean): string =>
  `${pointer(focused)} #${todo.id} [${statusMark(todo.status)}] ${todo.title}`;

/**
 * 画面全体を行配列へ整形する純粋関数。ヘッダ・各 todo 行・選択可能な「終了」項目・
 * 操作ガイドを組み立てる。空リストなら案内文を出す。Enter / Space で選択する対象を
 * フォーカスで示すため、終了項目も todo 行と同じ `>` ポインタで描く。driver はこの
 * 戻り値を改行で連結して描画するだけで、整形ロジックは I/O から独立してテストできる。
 *
 * @param state - 描画する画面状態。
 * @returns 画面に出力する行の配列。
 */
export const renderFrame = (state: TuiState): string[] => {
  const header = ["clido — todo 一覧", ""];
  const rows =
    state.todos.length === 0
      ? ["todo はありません。"]
      : state.todos.map((todo, index) => renderRow(todo, index === state.focus));
  const quitRow = `${pointer(isQuitFocused(state))} ${QUIT_LABEL}`;
  return [...header, ...rows, "", quitRow, "", helpLine];
};
