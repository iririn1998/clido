import { complete, reopen } from "../core/todo.ts";
import type { TodoRepository } from "../repository/todo-repository.ts";
import { parseKey } from "./keys.ts";
import { focusedTodo, initState, moveFocus, withTodos } from "./state.ts";
import { renderFrame } from "./view.ts";

/** 画面をクリアしてカーソルを左上へ戻す（ESC `[2J` + ESC `[H`）。 */
const CLEAR_SCREEN = "\x1b[2J\x1b[H";
/** カーソルを隠す（ESC `[?25l`）。 */
const HIDE_CURSOR = "\x1b[?25l";
/** カーソルを再表示する（ESC `[?25h`）。 */
const SHOW_CURSOR = "\x1b[?25h";

/**
 * 対話セッションが読む入力ストリーム。raw mode 切り替えと、`data` チャンクを
 * 順に取り出す `AsyncIterable` だけを要求する。`process.stdin` がこれを満たし、
 * テストでは台本どおりにチャンクを yield する fake を渡せる。
 */
export type InputStream = AsyncIterable<string | Uint8Array> & {
  setRawMode?: (mode: boolean) => void;
  setEncoding?: (encoding: "utf8") => void;
  pause?: () => void;
};

/**
 * 対話セッションが書く出力ストリーム。`write` だけを要求し、`process.stdout` と
 * 行を捕捉する fake の双方を受け入れる。
 */
export type OutputStream = {
  write: (chunk: string) => void;
};

/**
 * 対話セッションの依存一式。`repo` で永続化、`now` を完了/再開時刻のクロック源、
 * `input` / `output` で端末 I/O を注入する。
 */
export type SessionDeps = {
  repo: TodoRepository;
  now: () => Date;
  input: InputStream;
  output: OutputStream;
};

/**
 * 対話的な todo 一覧セッションを実行する。起動時に一覧を読み込んで全画面描画し、
 * 入力チャンクを {@link parseKey} で操作へ写像してフォーカス移動・項目選択を行う。
 *
 * `select`（Enter / Space）はフォーカス中の項目を選択する。todo 行なら状態に応じて
 * core の純粋関数 `complete` / `reopen` を選んで `repo.update` で永続化し、一覧を
 * 読み直して再描画する。末尾の「終了」項目（`focusedTodo` が `undefined`）を選んだ
 * 場合はループを抜けて終了する。入力チャンクは `AsyncIterable` から逐次取り出すため、
 * トグルの I/O は次のキー処理をブロックし、書き込みが重ならない。`quit`（`q` /
 * Ctrl-C）・終了項目の選択・ストリーム終端のいずれでもループを抜け、raw mode 解除と
 * カーソル再表示を `finally` で必ず行う。
 *
 * @param deps - repository・クロック・端末 I/O の依存一式。
 */
export const runSession = async (deps: SessionDeps): Promise<void> => {
  const { repo, now, input, output } = deps;

  let state = initState(await repo.list());

  /**
   * 現在の `state` を全画面で再描画する。画面クリア後に行配列を CRLF 連結して書く
   * （raw mode では `\n` 単体だと行頭へ戻らないため `\r\n` を使う）。
   */
  const draw = (): void => {
    output.write(`${CLEAR_SCREEN}${renderFrame(state).join("\r\n")}\r\n`);
  };

  input.setRawMode?.(true);
  input.setEncoding?.("utf8");
  output.write(HIDE_CURSOR);
  draw();

  try {
    for await (const chunk of input) {
      const action = parseKey(typeof chunk === "string" ? chunk : chunk.toString());
      if (action === "quit") {
        break;
      }
      if (action === "up") {
        state = moveFocus(state, -1);
      } else if (action === "down") {
        state = moveFocus(state, 1);
      } else if (action === "select") {
        const target = focusedTodo(state);
        if (target === undefined) {
          // 終了項目を選択 → ループを抜けて終了する。
          break;
        }
        const at = now();
        await repo.update(target.id, (current) =>
          current.status === "done" ? reopen(current, at) : complete(current, at),
        );
        state = withTodos(state, await repo.list());
      } else {
        continue;
      }
      draw();
    }
  } finally {
    input.setRawMode?.(false);
    output.write(SHOW_CURSOR);
    input.pause?.();
  }
};
