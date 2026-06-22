import { complete, reopen } from "../core/todo.ts";
import type { TodoRepository } from "../repository/todo-repository.ts";
import { parseInputKey, parseKey } from "./keys.ts";
import { focusedTodo, initState, moveFocus, withTodos } from "./state.ts";
import { renderFrame, renderInputFrame } from "./view.ts";

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
 * 入力チャンクを操作へ写像する。画面は「一覧モード」と「入力モード」の2状態を持ち、
 * `draft`（`null` なら一覧モード、文字列なら入力モード）で切り替える。
 *
 * 一覧モードでは {@link parseKey} でフォーカス移動・項目選択・追加・一括削除・終了を扱う。
 * `select`（Enter / Space）はフォーカス中の todo の状態に応じて core の純粋関数 `complete` /
 * `reopen` を選んで `repo.update` で永続化し、一覧を読み直して再描画する。`add`（`a`）は
 * 入力モードへ切り替え、`clear`（`c`）は `repo.deleteCompleted` で完了済みをまとめて削除して
 * 再描画する。
 *
 * 入力モードでは {@link parseInputKey} で文字挿入・1文字削除・確定・取消を扱う。確定時に
 * trim 後の `draft` が非空なら `repo.add` で追加して一覧へ戻り、空なら何もせず戻る。取消は
 * 破棄して戻る。入力チャンクは `AsyncIterable` から逐次取り出すため、I/O は次のキー処理を
 * ブロックし書き込みが重ならない。`quit`（`q` / Ctrl-C）またはストリーム終端でループを抜け、
 * raw mode 解除とカーソル再表示を `finally` で必ず行う。
 *
 * @param deps - repository・クロック・端末 I/O の依存一式。
 */
export const runSession = async (deps: SessionDeps): Promise<void> => {
  const { repo, now, input, output } = deps;

  let state = initState(await repo.list());
  // null なら一覧モード、文字列なら入力モード（編集中のタイトル）。
  let draft: string | null = null;

  /**
   * 現在のモードに応じて全画面で再描画する。画面クリア後に行配列を CRLF 連結して書く
   * （raw mode では `\n` 単体だと行頭へ戻らないため `\r\n` を使う）。
   */
  const draw = (): void => {
    const lines = draft === null ? renderFrame(state) : renderInputFrame(draft);
    output.write(`${CLEAR_SCREEN}${lines.join("\r\n")}\r\n`);
  };

  input.setRawMode?.(true);
  input.setEncoding?.("utf8");
  output.write(HIDE_CURSOR);
  draw();

  try {
    for await (const chunk of input) {
      const text = typeof chunk === "string" ? chunk : chunk.toString();

      if (draft !== null) {
        const key = parseInputKey(text);
        if (key.type === "commit") {
          const title = draft.trim();
          if (title.length > 0) {
            await repo.add({ title, now: now() });
            state = withTodos(state, await repo.list());
          }
          draft = null;
        } else if (key.type === "cancel") {
          draft = null;
        } else if (key.type === "backspace") {
          draft = [...draft].slice(0, -1).join("");
        } else if (key.type === "insert") {
          draft += key.text;
        } else {
          continue;
        }
        draw();
        continue;
      }

      const action = parseKey(text);
      if (action === "quit") {
        break;
      }
      if (action === "up") {
        state = moveFocus(state, -1);
      } else if (action === "down") {
        state = moveFocus(state, 1);
      } else if (action === "add") {
        draft = "";
      } else if (action === "clear") {
        await repo.deleteCompleted();
        state = withTodos(state, await repo.list());
      } else if (action === "select") {
        const target = focusedTodo(state);
        if (target === undefined) {
          continue;
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
