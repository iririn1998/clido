import { describe, expect, it } from "vitest";
import { createAddCommand } from "../../src/commands/add.ts";
import { UsageError } from "../../src/core/errors.ts";
import type { Todo } from "../../src/core/todo.ts";
import { invoke, makeContext, makeFakeRepo, makeOutput } from "../support.ts";

const fixed = new Date("2026-06-16T09:00:00.000Z");

describe("add command", () => {
  it("adds a trimmed title and renders the created todo", async () => {
    const created: Todo = {
      id: 1,
      title: "牛乳を買う",
      status: "open",
      createdAt: fixed.toISOString(),
      updatedAt: fixed.toISOString(),
      completedAt: null,
    };
    let addInput: { title: string; now: Date } | undefined;
    const repo = makeFakeRepo({
      add: async (input) => {
        addInput = input;
        return created;
      },
    });
    const { output, captured } = makeOutput();
    const command = createAddCommand({ getContext: () => makeContext(repo, output, fixed) });

    await invoke(command, { title: "  牛乳を買う  " });

    expect(addInput).toEqual({ title: "牛乳を買う", now: fixed });
    expect(captured.todos).toEqual([created]);
  });

  it("rejects a whitespace-only title with UsageError", async () => {
    const repo = makeFakeRepo();
    const { output } = makeOutput();
    const command = createAddCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { title: "   " })).rejects.toBeInstanceOf(UsageError);
  });

  it("rejects a title containing control characters with UsageError", async () => {
    const repo = makeFakeRepo();
    const { output } = makeOutput();
    const command = createAddCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { title: "a\nb" })).rejects.toBeInstanceOf(UsageError);
  });
});
