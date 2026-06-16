import { describe, expect, it } from "vitest";
import { createReopenCommand } from "../../src/commands/reopen.ts";
import { NotFoundError, UsageError } from "../../src/core/errors.ts";
import type { Todo } from "../../src/core/todo.ts";
import { invoke, makeContext, makeFakeRepo, makeOutput } from "../support.ts";

const fixed = new Date("2026-06-16T12:00:00.000Z");

const doneTodo: Todo = {
  id: 1,
  title: "牛乳を買う",
  status: "done",
  createdAt: "2026-06-16T09:00:00.000Z",
  updatedAt: "2026-06-16T10:00:00.000Z",
  completedAt: "2026-06-16T10:00:00.000Z",
};

describe("reopen command", () => {
  it("reopens the todo via update and renders the result", async () => {
    let updatedId: number | undefined;
    let changed: Todo | undefined;
    const repo = makeFakeRepo({
      update: async (id, change) => {
        updatedId = id;
        changed = change(doneTodo);
        return changed;
      },
    });
    const { output, captured } = makeOutput();
    const command = createReopenCommand({ getContext: () => makeContext(repo, output, fixed) });

    await invoke(command, { id: "1" });

    expect(updatedId).toBe(1);
    expect(changed).toEqual({
      ...doneTodo,
      status: "open",
      completedAt: null,
      updatedAt: fixed.toISOString(),
    });
    expect(captured.todos).toEqual([changed]);
  });

  it("rejects a non-positive id with UsageError", async () => {
    const repo = makeFakeRepo();
    const { output } = makeOutput();
    const command = createReopenCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "0" })).rejects.toBeInstanceOf(UsageError);
  });

  it("propagates NotFoundError when the todo does not exist", async () => {
    const repo = makeFakeRepo({
      update: async (id) => {
        throw new NotFoundError(`todo が見つかりません: #${id}`);
      },
    });
    const { output } = makeOutput();
    const command = createReopenCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "99" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
