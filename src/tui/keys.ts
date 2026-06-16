/**
 * 対話モード（素の `clido`）で扱うキー入力を意味づけした操作。raw mode の
 * stdin から届く生バイト列を、この有限集合のいずれかへ写像する。
 */
export type TuiAction = "up" | "down" | "toggle" | "quit" | "none";

/** `↑` の端末エスケープシーケンス（ESC `[` `A`）。 */
const UP_ARROW = "[A";
/** `↓` の端末エスケープシーケンス（ESC `[` `B`）。 */
const DOWN_ARROW = "[B";
/** Ctrl-C（ETX）。raw mode では SIGINT ではなくこのバイトが届く。 */
const CTRL_C = "";

/**
 * raw mode の stdin から届いた入力チャンクを {@link TuiAction} へ変換する純粋関数。
 *
 * 矢印キー（`↑` / `↓`）と vim 風の `k` / `j` をフォーカス移動、Enter / Space を
 * 完了状態のトグル、`q` と Ctrl-C を終了に対応づける。解釈できない入力は `none`。
 * I/O に触れないため単体テスト可能で、driver 側はこの戻り値だけを見て状態遷移する。
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
      return "toggle";
    case "q":
    case CTRL_C:
      return "quit";
    default:
      return "none";
  }
};
