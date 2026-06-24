import { describe, expect, it } from "vitest";
import { createJsonOutput, createPlainOutput } from "../../src/infra/output.ts";
import type { Todo } from "../../src/core/todo.ts";

const doneTodo: Todo = {
  id: 1,
  title: "牛乳を買う",
  status: "done",
  createdAt: "2026-06-22T14:03:18.317Z",
  updatedAt: "2026-06-22T14:03:18.388Z",
  completedAt: "2026-06-22T14:03:18.388Z",
};

const openTodo: Todo = {
  id: 2,
  title: "卵を買う",
  status: "open",
  createdAt: "2026-06-22T14:03:18.317Z",
  updatedAt: "2026-06-22T14:03:18.317Z",
  completedAt: null,
};

const capture = () => {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    writeOut: (message: string) => {
      out.push(message);
    },
    writeErr: (message: string) => {
      err.push(message);
    },
  };
};

describe("plain output todoDetail", () => {
  it("renders multi-line details with every field for a done todo", () => {
    const sink = capture();
    const output = createPlainOutput(sink.writeOut, sink.writeErr);

    output.todoDetail({ todo: doneTodo });

    expect(sink.out).toEqual([
      "#1 牛乳を買う",
      "status      : done",
      "createdAt   : 2026-06-22T14:03:18.317Z",
      "updatedAt   : 2026-06-22T14:03:18.388Z",
      "completedAt : 2026-06-22T14:03:18.388Z",
    ]);
  });

  it("shows a dash for an unset completedAt", () => {
    const sink = capture();
    const output = createPlainOutput(sink.writeOut, sink.writeErr);

    output.todoDetail({ todo: openTodo });

    expect(sink.out).toContain("completedAt : -");
  });

  it("differs from the single-line list rendering", () => {
    const sink = capture();
    const output = createPlainOutput(sink.writeOut, sink.writeErr);

    output.todo({ todo: doneTodo });

    expect(sink.out).toEqual(["#1 [x] 牛乳を買う"]);
  });
});

describe("json output todoDetail", () => {
  it("returns the full todo as a single-line JSON object", () => {
    const sink = capture();
    const output = createJsonOutput(sink.writeOut, sink.writeErr);

    output.todoDetail({ todo: doneTodo });

    expect(sink.out).toHaveLength(1);
    expect(JSON.parse(sink.out[0])).toEqual({ todo: doneTodo });
  });
});
