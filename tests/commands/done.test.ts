import { describe, expect, it } from "vitest";
import { createDoneCommand } from "../../src/commands/done.ts";
import { NotFoundError, UsageError } from "../../src/core/errors.ts";
import type { Todo } from "../../src/core/todo.ts";
import { invoke, makeContext, makeFakeRepo, makeOutput } from "../support.ts";

const fixed = new Date("2026-06-16T12:00:00.000Z");

const openTodo: Todo = {
  id: 1,
  title: "牛乳を買う",
  status: "open",
  createdAt: "2026-06-16T09:00:00.000Z",
  updatedAt: "2026-06-16T09:00:00.000Z",
  completedAt: null,
};

describe("done command", () => {
  it("completes the todo via update and renders the result", async () => {
    let updatedId: number | undefined;
    let changed: Todo | undefined;
    const repo = makeFakeRepo({
      update: async (id, change) => {
        updatedId = id;
        changed = change(openTodo);
        return changed;
      },
    });
    const { output, captured } = makeOutput();
    const command = createDoneCommand({ getContext: () => makeContext(repo, output, fixed) });

    await invoke(command, { id: "1" });

    expect(updatedId).toBe(1);
    expect(changed).toEqual({
      ...openTodo,
      status: "done",
      completedAt: fixed.toISOString(),
      updatedAt: fixed.toISOString(),
    });
    expect(captured.todos).toEqual([changed]);
  });

  it("rejects a non-numeric id with UsageError", async () => {
    const repo = makeFakeRepo();
    const { output } = makeOutput();
    const command = createDoneCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "abc" })).rejects.toBeInstanceOf(UsageError);
  });

  it("propagates NotFoundError when the todo does not exist", async () => {
    const repo = makeFakeRepo({
      update: async (id) => {
        throw new NotFoundError(`todo が見つかりません: #${id}`);
      },
    });
    const { output } = makeOutput();
    const command = createDoneCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "99" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
