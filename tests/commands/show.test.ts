import { describe, expect, it } from "vitest";
import { createShowCommand } from "../../src/commands/show.ts";
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

describe("show command", () => {
  it("fetches the todo via get and renders it", async () => {
    let requestedId: number | undefined;
    const repo = makeFakeRepo({
      get: async (id) => {
        requestedId = id;
        return openTodo;
      },
    });
    const { output, captured } = makeOutput();
    const command = createShowCommand({ getContext: () => makeContext(repo, output, fixed) });

    await invoke(command, { id: "1" });

    expect(requestedId).toBe(1);
    expect(captured.details).toEqual([openTodo]);
  });

  it("rejects a non-numeric id with UsageError", async () => {
    const repo = makeFakeRepo();
    const { output } = makeOutput();
    const command = createShowCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "abc" })).rejects.toBeInstanceOf(UsageError);
  });

  it("throws NotFoundError when get returns null", async () => {
    const repo = makeFakeRepo({
      get: async () => null,
    });
    const { output } = makeOutput();
    const command = createShowCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "99" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
