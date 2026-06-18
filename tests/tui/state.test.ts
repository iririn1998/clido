import { describe, expect, it } from "vitest";
import type { Todo } from "../../src/core/todo.ts";
import {
  focusedTodo,
  initState,
  isQuitFocused,
  itemCount,
  moveFocus,
  withTodos,
} from "../../src/tui/state.ts";

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

describe("itemCount", () => {
  it("counts every todo plus the trailing quit item", () => {
    expect(itemCount({ todos, focus: 0 })).toBe(4);
  });

  it("is 1 (quit item only) for an empty list", () => {
    expect(itemCount(initState([]))).toBe(1);
  });
});

describe("isQuitFocused", () => {
  it("is true when focus is on the index past the last todo", () => {
    expect(isQuitFocused({ todos, focus: 3 })).toBe(true);
  });

  it("is false while a todo is focused", () => {
    expect(isQuitFocused({ todos, focus: 2 })).toBe(false);
  });

  it("is true for an empty list at focus 0", () => {
    expect(isQuitFocused(initState([]))).toBe(true);
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

  it("can move past the last todo onto the quit item", () => {
    const state = moveFocus({ todos, focus: 2 }, 1);
    expect(state.focus).toBe(3);
    expect(isQuitFocused(state)).toBe(true);
  });

  it("clamps at the quit item (bottom edge) without wrapping", () => {
    const state = moveFocus({ todos, focus: 3 }, 1);
    expect(state.focus).toBe(3);
  });

  it("stays put on an empty list (quit item only)", () => {
    const empty = initState([]);
    expect(moveFocus(empty, 1)).toBe(empty);
  });
});

describe("withTodos", () => {
  it("keeps the focus index when the list is unchanged in length", () => {
    const state = withTodos({ todos, focus: 2 }, todos);
    expect(state.focus).toBe(2);
  });

  it("keeps focus on the quit item across a reload", () => {
    const state = withTodos({ todos, focus: 3 }, todos);
    expect(state.focus).toBe(3);
  });

  it("clamps the focus into range when the list shrinks", () => {
    const state = withTodos({ todos, focus: 3 }, [makeTodo(1)]);
    expect(state.focus).toBe(1);
  });

  it("clamps focus to the quit item when the list becomes empty", () => {
    const state = withTodos({ todos, focus: 2 }, []);
    expect(state.focus).toBe(0);
  });
});

describe("focusedTodo", () => {
  it("returns the todo at the focus index", () => {
    expect(focusedTodo({ todos, focus: 1 })?.id).toBe(2);
  });

  it("returns undefined when the quit item is focused", () => {
    expect(focusedTodo({ todos, focus: 3 })).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(focusedTodo(initState([]))).toBeUndefined();
  });
});
