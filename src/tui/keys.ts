/**
 * 一覧モード（素の `clido` の既定画面）で扱うキー入力を意味づけした操作。raw mode の
 * stdin から届く生バイト列を、この有限集合のいずれかへ写像する。`add` は入力モードへの
 * 切り替え、`clear` は完了済みの一括削除を表す。
 */
export type TuiAction = "up" | "down" | "select" | "add" | "clear" | "quit" | "none";

/**
 * 入力モード（todo タイトルの編集中）で扱うキー入力を意味づけした操作。確定 / 取消 /
 * 1文字削除 / 文字挿入 / 無視のいずれかへ写像する。`insert` だけが挿入文字列を伴う。
 */
export type InputAction =
  | { type: "commit" }
  | { type: "cancel" }
  | { type: "backspace" }
  | { type: "insert"; text: string }
  | { type: "none" };

/** `↑` の端末エスケープシーケンス（ESC `[A`）。 */
const UP_ARROW = "\x1b[A";
/** `↓` の端末エスケープシーケンス（ESC `[B`）。 */
const DOWN_ARROW = "\x1b[B";
/** Ctrl-C（ETX）。raw mode では SIGINT ではなくこのバイトが届く。 */
const CTRL_C = "\x03";
/** 単独の ESC（エスケープシーケンスの先頭ではない素の ESC）。入力モードの取消に使う。 */
const ESC = "\x1b";

/**
 * raw mode の stdin から届いた入力チャンクを {@link TuiAction} へ変換する純粋関数。
 *
 * 矢印キー（`↑` / `↓`）と vim 風の `k` / `j` をフォーカス移動、Enter / Space を
 * フォーカス中の項目の選択（`select`）、`a` を todo 追加（入力モードへ）、`c` を完了済みの
 * 一括削除、`q` と Ctrl-C を終了に対応づける。`select` が todo 行で完了トグルを、終了項目で
 * 終了を意味するかは driver が文脈で解釈する。解釈できない入力は `none`。
 *
 * @param input - stdin から受け取った文字列チャンク。
 * @returns 対応する操作（未対応の入力は `none`）。
 */
export const parseKey = (input: string): TuiAction => {
  switch (input) {
    case UP_ARROW:
    case "k":
      return "up";
    case DOWN_ARROW:
    case "j":
      return "down";
    case "\r":
    case "\n":
    case " ":
      return "select";
    case "a":
      return "add";
    case "c":
      return "clear";
    case "q":
    case CTRL_C:
      return "quit";
    default:
      return "none";
  }
};

/**
 * 文字列が表示可能文字（制御文字を含まない）だけで構成されるか判定する。各コードポイントが
 * `0x20`（空白）以上かつ `0x7f`（DEL）でないことを要求する。矢印キーなどのエスケープ
 * シーケンスは ESC（`0x1b`）を含むため弾かれ、入力モードで誤挿入されない。
 *
 * @param input - 判定対象の文字列チャンク。
 * @returns すべて表示可能文字なら `true`。
 */
const isPrintable = (input: string): boolean =>
  [...input].every((char) => {
    const codePoint = char.codePointAt(0);
    return codePoint !== undefined && codePoint >= 0x20 && codePoint !== 0x7f;
  });

/**
 * 入力モードで raw mode の stdin から届いたチャンクを {@link InputAction} へ変換する純粋
 * 関数。Enter（CR / LF）を確定、ESC / Ctrl-C を取消、Backspace / Delete を1文字削除、
 * 表示可能文字のチャンクを挿入文字列に対応づける。矢印キー等のエスケープシーケンスや
 * その他の制御入力は `none` として無視する。
 *
 * @param input - stdin から受け取った文字列チャンク。
 * @returns 対応する操作（未対応の入力は `{ type: "none" }`）。
 */
export const parseInputKey = (input: string): InputAction => {
  if (input === "\r" || input === "\n") {
    return { type: "commit" };
  }
  if (input === ESC || input === CTRL_C) {
    return { type: "cancel" };
  }
  if (input === "\x7f" || input === "\x08") {
    return { type: "backspace" };
  }
  if (input.length > 0 && isPrintable(input)) {
    return { type: "insert", text: input };
  }
  return { type: "none" };
};
