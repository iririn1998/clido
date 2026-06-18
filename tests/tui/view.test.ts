import { describe, expect, it } from "vitest";
import type { Todo } from "../../src/core/todo.ts";
import {
  displayWidth,
  HELP_TITLE,
  QUIT_LABEL,
  renderFrame,
  renderHelp,
  renderRow,
} from "../../src/tui/view.ts";

const makeTodo = (id: number, status: Todo["status"]): Todo => ({
  id,
  title: `todo ${id}`,
  status,
  createdAt: "2026-06-17T00:00:00.000Z",
  updatedAt: "2026-06-17T00:00:00.000Z",
  completedAt: status === "done" ? "2026-06-17T00:00:00.000Z" : null,
});

describe("displayWidth", () => {
  it("counts ASCII characters as one cell each", () => {
    expect(displayWidth("Enter / Space")).toBe(13);
  });

  it("counts full-width Japanese characters as two cells each", () => {
    expect(displayWidth("終了")).toBe(4);
    expect(displayWidth("フォーカスを移動")).toBe(16);
  });

  it("counts arrows and box-drawing characters as one cell", () => {
    expect(displayWidth("↑ / ↓")).toBe(5);
    expect(displayWidth("─╮")).toBe(2);
  });
});

describe("renderRow", () => {
  it("marks the focused row with a pointer", () => {
    expect(renderRow(makeTodo(1, "open"), true)).toBe("> #1 [ ] todo 1");
  });

  it("pads unfocused rows and marks done with x", () => {
    expect(renderRow(makeTodo(2, "done"), false)).toBe("  #2 [x] todo 2");
  });
});

describe("renderHelp", () => {
  it("frames the guide with a titled box", () => {
    const help = renderHelp();
    expect(help[0]).toContain(HELP_TITLE);
    expect(help[0].startsWith("╭")).toBe(true);
    expect(help.at(-1)?.startsWith("╰")).toBe(true);
    expect(help.join("\n")).toContain("フォーカスを移動");
  });

  it("aligns every framed line to the same display width", () => {
    const widths = renderHelp().map((line) => displayWidth(line));
    expect(new Set(widths).size).toBe(1);
  });
});

describe("renderFrame", () => {
  it("renders every todo with the focused row pointed at", () => {
    const frame = renderFrame({ todos: [makeTodo(1, "open"), makeTodo(2, "done")], focus: 1 });
    expect(frame).toContain("  #1 [ ] todo 1");
    expect(frame).toContain("> #2 [x] todo 2");
  });

  it("includes the framed help box", () => {
    const frame = renderFrame({ todos: [makeTodo(1, "open")], focus: 0 });
    expect(frame.some((line) => line.includes(HELP_TITLE))).toBe(true);
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
    expect(frame.some((line) => line.includes(HELP_TITLE))).toBe(true);
  });
});
