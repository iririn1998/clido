import type { Todo } from "../core/todo.ts";

/**
 * 対話モードの画面状態。表示中の `todos` と、現在フォーカスしている行の `focus`
 * インデックスだけを持つ素のデータ。I/O を持たず、遷移はすべて純粋関数で行う。
 */
export type TuiState = {
  todos: Todo[];
  focus: number;
};

/**
 * 一覧から初期状態を作る。先頭行（index 0）にフォーカスする。
 *
 * @param todos - 表示する Todo 配列。
 * @returns 先頭にフォーカスした初期状態。
 */
export const initState = (todos: Todo[]): TuiState => ({ todos, focus: 0 });

/**
 * フォーカスを `delta` 行ぶん移動する純粋関数。`[0, len-1]` の範囲にクランプし、
 * 端を超える移動は無視する（端でのラップアラウンドはしない）。空リストでは何もしない。
 *
 * @param state - 現在の状態。
 * @param delta - 移動量（上は `-1`、下は `+1`）。
 * @returns 移動後の状態（移動が無ければ入力をそのまま返す）。
 */
export const moveFocus = (state: TuiState, delta: number): TuiState => {
  if (state.todos.length === 0) {
    return state;
  }
  const max = state.todos.length - 1;
  const next = Math.min(Math.max(state.focus + delta, 0), max);
  if (next === state.focus) {
    return state;
  }
  return { ...state, focus: next };
};

/**
 * 一覧を差し替えてもフォーカス位置を保つ純粋関数。トグル後に repository から
 * 取り直した最新の `todos` を反映する用途。件数が減った場合は `focus` を末尾へ
 * クランプし、空になったら `0` にする。
 *
 * @param state - 現在の状態。
 * @param todos - 差し替える最新の Todo 配列。
 * @returns フォーカスを範囲内に保った新しい状態。
 */
export const withTodos = (state: TuiState, todos: Todo[]): TuiState => {
  const max = Math.max(todos.length - 1, 0);
  return { todos, focus: Math.min(state.focus, max) };
};

/**
 * 現在フォーカスしている Todo を返す。空リストや範囲外なら `undefined`。
 *
 * @param state - 現在の状態。
 * @returns フォーカス中の Todo、または `undefined`。
 */
export const focusedTodo = (state: TuiState): Todo | undefined => state.todos[state.focus];
