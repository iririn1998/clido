import { describe, expect, it } from "vitest";
import type { Todo } from "../../src/core/todo.ts";
import type { TodoRepository } from "../../src/repository/todo-repository.ts";
import { runSession, type InputStream } from "../../src/tui/session.ts";

const TOGGLE = "\r";
const DOWN = "\x1b[B";
const QUIT = "q";

const makeTodo = (id: number, status: Todo["status"]): Todo => ({
  id,
  title: `todo ${id}`,
  status,
  createdAt: "2026-06-17T00:00:00.000Z",
  updatedAt: "2026-06-17T00:00:00.000Z",
  completedAt: status === "done" ? "2026-06-17T00:00:00.000Z" : null,
});

/**
 * 台本どおりにチャンクを yield する fake 入力。raw mode 系メソッドは no-op。
 */
const scriptedInput = (chunks: string[]): InputStream => ({
  setRawMode: () => undefined,
  setEncoding: () => undefined,
  pause: () => undefined,
  [Symbol.asyncIterator]: async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  },
});

/**
 * 配列を保持する最小のインメモリ repository。list / update のみ実装する。
 */
const memoryRepo = (initial: Todo[]): { repo: TodoRepository; todos: Todo[] } => {
  let todos = [...initial];
  const repo: TodoRepository = {
    list: async () => [...todos].sort((a, b) => a.id - b.id),
    get: async (id) => todos.find((todo) => todo.id === id) ?? null,
    add: async () => {
      throw new Error("not used");
    },
    update: async (id, change) => {
      const index = todos.findIndex((todo) => todo.id === id);
      const updated = change(todos[index]);
      todos = todos.map((todo) => (todo.id === id ? updated : todo));
      return updated;
    },
    delete: async () => undefined,
  };
  return {
    repo,
    get todos() {
      return todos;
    },
  };
};

const capture = (): { output: { write: (chunk: string) => void }; frames: string[] } => {
  const frames: string[] = [];
  return { output: { write: (chunk) => frames.push(chunk) }, frames };
};

const now = (): Date => new Date("2026-06-17T12:00:00.000Z");

describe("runSession", () => {
  it("toggles the focused todo to done on enter", async () => {
    const store = memoryRepo([makeTodo(1, "open"), makeTodo(2, "open")]);
    const { output } = capture();

    await runSession({
      repo: store.repo,
      now,
      input: scriptedInput([TOGGLE, QUIT]),
      output,
    });

    expect(store.todos.find((todo) => todo.id === 1)?.status).toBe("done");
    expect(store.todos.find((todo) => todo.id === 2)?.status).toBe("open");
  });

  it("toggles the row under the moved focus", async () => {
    const store = memoryRepo([makeTodo(1, "open"), makeTodo(2, "open")]);
    const { output } = capture();

    await runSession({
      repo: store.repo,
      now,
      input: scriptedInput([DOWN, TOGGLE, QUIT]),
      output,
    });

    expect(store.todos.find((todo) => todo.id === 1)?.status).toBe("open");
    expect(store.todos.find((todo) => todo.id === 2)?.status).toBe("done");
  });

  it("reopens a done todo when toggled again", async () => {
    const store = memoryRepo([makeTodo(1, "done")]);
    const { output } = capture();

    await runSession({
      repo: store.repo,
      now,
      input: scriptedInput([TOGGLE, QUIT]),
      output,
    });

    expect(store.todos.find((todo) => todo.id === 1)?.status).toBe("open");
  });

  it("restores the cursor and ends when the stream ends without quit", async () => {
    const store = memoryRepo([makeTodo(1, "open")]);
    const { output, frames } = capture();

    await runSession({
      repo: store.repo,
      now,
      input: scriptedInput([]),
      output,
    });

    // hide cursor on entry, show cursor on exit.
    expect(frames.some((frame) => frame.includes("?25l"))).toBe(true);
    expect(frames.some((frame) => frame.includes("?25h"))).toBe(true);
  });
});
