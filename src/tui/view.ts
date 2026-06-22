import type { Todo, TodoStatus } from "../core/todo.ts";
import type { TuiState } from "./state.ts";

/** 操作方法ボックスのタイトル。 */
export const HELP_TITLE = "操作方法";

/**
 * 操作方法ボックスに並べるキーと説明の対。Enter / Space はフォーカス中の todo の
 * 完了状態を切り替える。
 */
export const helpEntries: readonly (readonly [keys: string, description: string])[] = [
  ["↑ / ↓  (j / k)", "フォーカスを移動"],
  ["Enter / Space", "完了状態を切替"],
  ["a", "todo を追加"],
  ["c", "完了済みを一括削除"],
  ["q / Ctrl-C", "終了"],
];

/** 入力モードの操作方法ボックスに並べるキーと説明の対。 */
export const inputHelpEntries: readonly (readonly [keys: string, description: string])[] = [
  ["Enter", "追加を確定"],
  ["Esc / Ctrl-C", "取消"],
];

/**
 * 文字が端末上で2セル幅（全角）で描画されるか判定する。日本語の仮名・漢字・
 * 全角記号や絵文字などの主要な East Asian Wide / Fullwidth 範囲を対象にする。
 * 矢印（`↑` / `↓`）や罫線・ダッシュなどの曖昧幅文字は1セル幅として扱う。
 *
 * @param codePoint - 判定する文字のコードポイント。
 * @returns 2セル幅なら `true`。
 */
const isWide = (codePoint: number): boolean =>
  (codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
  (codePoint >= 0x2e80 && codePoint <= 0xa4cf) || // CJK 部首〜かな〜漢字〜Yi
  (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul 音節
  (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK 互換漢字
  (codePoint >= 0xfe30 && codePoint <= 0xfe4f) || // CJK 互換形
  (codePoint >= 0xff00 && codePoint <= 0xff60) || // 全角英数・記号
  (codePoint >= 0xffe0 && codePoint <= 0xffe6) || // 全角記号
  (codePoint >= 0x1f300 && codePoint <= 0x1faff) || // 絵文字
  (codePoint >= 0x20000 && codePoint <= 0x3fffd); // CJK 拡張

/**
 * 文字列の端末表示幅（セル数）を返す純粋関数。全角文字を2、その他を1で数える。
 * 罫線の桁合わせに用いる。
 *
 * @param text - 計測する文字列。
 * @returns 表示幅（セル数）。
 */
export const displayWidth = (text: string): number => {
  let width = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    width += codePoint !== undefined && isWide(codePoint) ? 2 : 1;
  }
  return width;
};

/**
 * 文字列の右側を空白で埋め、表示幅を `width` セルに揃える。`width` 未満の文字列だけを
 * 想定し、超過分は埋めない。
 *
 * @param text - 対象の文字列。
 * @param width - 目標の表示幅（セル数）。
 * @returns 右パディング済みの文字列。
 */
const padRight = (text: string, width: number): string =>
  text + " ".repeat(Math.max(0, width - displayWidth(text)));

/**
 * タイトル付きの角丸ボックスで本文行を囲む純粋関数。全角混在でも罫線がずれないよう
 * {@link displayWidth} で桁を合わせる。
 *
 * @param title - 上枠に埋め込むタイトル。
 * @param lines - 枠内に表示する本文行。
 * @returns 枠線を含む描画行の配列。
 */
const boxed = (title: string, lines: readonly string[]): string[] => {
  const titleSegment = `─ ${title} `;
  const inner = Math.max(
    displayWidth(titleSegment),
    ...lines.map((line) => displayWidth(line) + 1),
  );
  const top = `╭${titleSegment}${"─".repeat(inner - displayWidth(titleSegment))}─╮`;
  const bottom = `╰${"─".repeat(inner + 1)}╯`;
  const body = lines.map((line) => `│ ${padRight(line, inner - 1)} │`);
  return [top, ...body, bottom];
};

/**
 * キーと説明の対を表示幅で桁揃えし、タイトル付きの枠で囲む純粋関数。一覧モードと
 * 入力モードの操作方法ボックスを同じ整形で描くために共有する。
 *
 * @param entries - キー列と説明の対の配列。
 * @returns タイトル付きの枠で囲んだ描画行。
 */
const renderKeyGuide = (
  entries: readonly (readonly [keys: string, description: string])[],
): string[] => {
  const keyWidth = Math.max(...entries.map(([keys]) => displayWidth(keys)));
  const rows = entries.map(([keys, description]) => `${padRight(keys, keyWidth)}   ${description}`);
  return boxed(HELP_TITLE, rows);
};

/**
 * 一覧モードの操作方法ボックスの描画行を返す純粋関数。
 *
 * @returns 操作方法ボックスの描画行。
 */
export const renderHelp = (): string[] => renderKeyGuide(helpEntries);

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
 * 画面全体を行配列へ整形する純粋関数。ヘッダ・各 todo 行・枠付きの操作方法ボックスを
 * 組み立てる。空リストなら案内文を出す。driver はこの戻り値を改行で連結して描画するだけで、
 * 整形ロジックは I/O から独立してテストできる。
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
  return [...header, ...rows, "", ...renderHelp()];
};

/** 入力モードのカーソルとして末尾に置くブロック文字。 */
const INPUT_CURSOR = "█";

/**
 * 入力モード（todo タイトルの編集中）の画面全体を行配列へ整形する純粋関数。ヘッダと
 * 編集中のタイトル行（末尾にカーソル）、確定 / 取消を案内する操作方法ボックスを組み立てる。
 *
 * @param draft - 編集中のタイトル文字列。
 * @returns 画面に出力する行の配列。
 */
export const renderInputFrame = (draft: string): string[] => {
  const header = ["clido — todo を追加", ""];
  const prompt = `タイトル: ${draft}${INPUT_CURSOR}`;
  return [...header, prompt, "", ...renderKeyGuide(inputHelpEntries)];
};
