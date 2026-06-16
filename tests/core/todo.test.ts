import { describe, expect, it } from "vitest";
import { complete, reopen, type Todo } from "../../src/core/todo.ts";

const createdAt = "2026-06-16T09:00:00.000Z";
const now = new Date("2026-06-16T12:00:00.000Z");

const openTodo: Todo = {
  id: 1,
  title: "牛乳を買う",
  status: "open",
  createdAt,
  updatedAt: createdAt,
  completedAt: null,
};

const doneTodo: Todo = {
  ...openTodo,
  status: "done",
  updatedAt: "2026-06-16T10:00:00.000Z",
  completedAt: "2026-06-16T10:00:00.000Z",
};

describe("complete", () => {
  it("marks an open todo as done with completedAt/updatedAt set to now", () => {
    const result = complete(openTodo, now);

    expect(result).toEqual({
      ...openTodo,
      status: "done",
      completedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it("does not mutate the input todo", () => {
    complete(openTodo, now);

    expect(openTodo.status).toBe("open");
    expect(openTodo.completedAt).toBeNull();
  });

  it("is idempotent and preserves the original completedAt when already done", () => {
    const result = complete(doneTodo, now);

    expect(result).toBe(doneTodo);
  });
});

describe("reopen", () => {
  it("marks a done todo as open, clearing completedAt and updating updatedAt", () => {
    const result = reopen(doneTodo, now);

    expect(result).toEqual({
      ...doneTodo,
      status: "open",
      completedAt: null,
      updatedAt: now.toISOString(),
    });
  });

  it("does not mutate the input todo", () => {
    reopen(doneTodo, now);

    expect(doneTodo.status).toBe("done");
    expect(doneTodo.completedAt).toBe("2026-06-16T10:00:00.000Z");
  });

  it("is idempotent when already open", () => {
    const result = reopen(openTodo, now);

    expect(result).toBe(openTodo);
  });
});
