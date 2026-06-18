import { describe, expect, it } from "vitest";
import type { Todo } from "../../src/core/todo.ts";
import { helpLine, QUIT_LABEL, renderFrame, renderRow } from "../../src/tui/view.ts";

const makeTodo = (id: number, status: Todo["status"]): Todo => ({
  id,
  title: `todo ${id}`,
  status,
  createdAt: "2026-06-17T00:00:00.000Z",
  updatedAt: "2026-06-17T00:00:00.000Z",
  completedAt: status === "done" ? "2026-06-17T00:00:00.000Z" : null,
});

describe("renderRow", () => {
  it("marks the focused row with a pointer", () => {
    expect(renderRow(makeTodo(1, "open"), true)).toBe("> #1 [ ] todo 1");
  });

  it("pads unfocused rows and marks done with x", () => {
    expect(renderRow(makeTodo(2, "done"), false)).toBe("  #2 [x] todo 2");
  });
});

describe("renderFrame", () => {
  it("renders every todo with the focused row pointed at", () => {
    const frame = renderFrame({ todos: [makeTodo(1, "open"), makeTodo(2, "done")], focus: 1 });
    expect(frame).toContain("  #1 [ ] todo 1");
    expect(frame).toContain("> #2 [x] todo 2");
    expect(frame).toContain(helpLine);
  });

  it("renders the quit item unfocused while a todo is focused", () => {
    const frame = renderFrame({ todos: [makeTodo(1, "open")], focus: 0 });
    expect(frame).toContain(`  ${QUIT_LABEL}`);
  });

  it("points at the quit item when it is focused", () => {
    const frame = renderFrame({ todos: [makeTodo(1, "open")], focus: 1 });
    expect(frame).toContain("  #1 [ ] todo 1");
    expect(frame).toContain(`> ${QUIT_LABEL}`);
  });

  it("shows an empty-state message and a focusable quit item when there are no todos", () => {
    const frame = renderFrame({ todos: [], focus: 0 });
    expect(frame).toContain("todo はありません。");
    expect(frame).toContain(`> ${QUIT_LABEL}`);
    expect(frame).toContain(helpLine);
  });
});
