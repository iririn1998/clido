import type { Todo } from "../core/todo.ts";

/**
 * 対話モードの画面状態。表示中の `todos` と、現在フォーカスしている行の `focus`
 * インデックスだけを持つ素のデータ。I/O を持たず、遷移はすべて純粋関数で行う。
 *
 * フォーカスは「各 todo 行」に続けて末尾の「終了」項目までを動く。すなわち
 * `focus` の範囲は `[0, todos.length]` で、`focus === todos.length` は終了項目を指す
 * （{@link isQuitFocused}）。Enter / Space はフォーカス中の項目を選択する操作で、
 * todo 行なら完了トグル、終了項目なら終了を意味する。
 */
export type TuiState = {
  todos: Todo[];
  focus: number;
};

/**
 * 一覧から初期状態を作る。先頭行（index 0）にフォーカスする。todo が無くても
 * 末尾の終了項目は常に存在するため、focus 0 は空リストでは終了項目を指す。
 *
 * @param todos - 表示する Todo 配列。
 * @returns 先頭にフォーカスした初期状態。
 */
export const initState = (todos: Todo[]): TuiState => ({ todos, focus: 0 });

/**
 * フォーカスが移動できる項目数。各 todo 行に末尾の終了項目を1つ加えた数。
 *
 * @param state - 現在の状態。
 * @returns 項目数（`todos.length + 1`）。
 */
export const itemCount = (state: TuiState): number => state.todos.length + 1;

/**
 * 現在のフォーカスが末尾の「終了」項目を指しているか。
 *
 * @param state - 現在の状態。
 * @returns 終了項目にフォーカスしていれば `true`。
 */
export const isQuitFocused = (state: TuiState): boolean => state.focus === state.todos.length;

/**
 * フォーカスを `delta` 行ぶん移動する純粋関数。`[0, todos.length]`（末尾の終了項目を含む）
 * の範囲にクランプし、端を超える移動は無視する（端でのラップアラウンドはしない）。
 *
 * @param state - 現在の状態。
 * @param delta - 移動量（上は `-1`、下は `+1`）。
 * @returns 移動後の状態（移動が無ければ入力をそのまま返す）。
 */
export const moveFocus = (state: TuiState, delta: number): TuiState => {
  const max = itemCount(state) - 1;
  const next = Math.min(Math.max(state.focus + delta, 0), max);
  if (next === state.focus) {
    return state;
  }
  return { ...state, focus: next };
};

/**
 * 一覧を差し替えてもフォーカス位置を保つ純粋関数。トグル後に repository から
 * 取り直した最新の `todos` を反映する用途。件数が減った場合は `focus` を範囲内
 * （末尾の終了項目まで）へクランプする。
 *
 * @param state - 現在の状態。
 * @param todos - 差し替える最新の Todo 配列。
 * @returns フォーカスを範囲内に保った新しい状態。
 */
export const withTodos = (state: TuiState, todos: Todo[]): TuiState => ({
  todos,
  focus: Math.min(state.focus, todos.length),
});

/**
 * 現在フォーカスしている Todo を返す。終了項目にフォーカスしている場合や
 * 範囲外なら `undefined`。
 *
 * @param state - 現在の状態。
 * @returns フォーカス中の Todo、または `undefined`。
 */
export const focusedTodo = (state: TuiState): Todo | undefined => state.todos[state.focus];
