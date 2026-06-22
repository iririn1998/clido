import { describe, expect, it } from "vitest";
import type { Todo } from "../../src/core/todo.ts";
import { focusedTodo, initState, moveFocus, withTodos } from "../../src/tui/state.ts";

const makeTodo = (id: number): Todo => ({
  id,
  title: `todo ${id}`,
  status: "open",
  createdAt: "2026-06-17T00:00:00.000Z",
  updatedAt: "2026-06-17T00:00:00.000Z",
  completedAt: null,
});

const todos = [makeTodo(1), makeTodo(2), makeTodo(3)];

describe("initState", () => {
  it("focuses the first row", () => {
    expect(initState(todos).focus).toBe(0);
  });
});

describe("moveFocus", () => {
  it("moves down within bounds", () => {
    const state = moveFocus(initState(todos), 1);
    expect(state.focus).toBe(1);
  });

  it("clamps at the top edge without wrapping", () => {
    const state = moveFocus(initState(todos), -1);
    expect(state.focus).toBe(0);
  });

  it("clamps at the last todo without wrapping", () => {
    const state = moveFocus({ todos, focus: 2 }, 1);
    expect(state.focus).toBe(2);
  });

  it("stays put on an empty list", () => {
    const empty = initState([]);
    expect(moveFocus(empty, 1)).toBe(empty);
  });
});

describe("withTodos", () => {
  it("keeps the focus index when the list is unchanged in length", () => {
    const state = withTodos({ todos, focus: 2 }, todos);
    expect(state.focus).toBe(2);
  });

  it("clamps the focus into range when the list shrinks", () => {
    const state = withTodos({ todos, focus: 3 }, [makeTodo(1)]);
    expect(state.focus).toBe(0);
  });

  it("clamps focus to zero when the list becomes empty", () => {
    const state = withTodos({ todos, focus: 2 }, []);
    expect(state.focus).toBe(0);
  });
});

describe("focusedTodo", () => {
  it("returns the todo at the focus index", () => {
    expect(focusedTodo({ todos, focus: 1 })?.id).toBe(2);
  });

  it("returns undefined for an empty list", () => {
    expect(focusedTodo(initState([]))).toBeUndefined();
  });
});
