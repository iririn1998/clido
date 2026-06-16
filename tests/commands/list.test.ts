import { describe, expect, it } from "vitest";
import { createListCommand } from "../../src/commands/list.ts";
import { UsageError } from "../../src/core/errors.ts";
import type { Todo } from "../../src/core/todo.ts";
import type { TodoStatus } from "../../src/core/todo.ts";
import { invoke, makeContext, makeFakeRepo, makeOutput } from "../support.ts";

const fixed = new Date("2026-06-16T09:00:00.000Z");

const sample: Todo = {
  id: 1,
  title: "牛乳を買う",
  status: "open",
  createdAt: fixed.toISOString(),
  updatedAt: fixed.toISOString(),
  completedAt: null,
};

const setup = () => {
  let filter: { status?: TodoStatus } | undefined;
  let filterSeen = false;
  const repo = makeFakeRepo({
    list: async (received) => {
      filter = received;
      filterSeen = true;
      return [sample];
    },
  });
  const { output, captured } = makeOutput();
  const command = createListCommand({ getContext: () => makeContext(repo, output, fixed) });
  return { command, output, captured, getFilter: () => filter, wasCalled: () => filterSeen };
};

describe("list command", () => {
  it("defaults to open todos and renders the list", async () => {
    const ctx = setup();

    await invoke(ctx.command, { all: false, status: undefined });

    expect(ctx.getFilter()).toEqual({ status: "open" });
    expect(ctx.captured.lists).toEqual([[sample]]);
  });

  it("passes no filter when --all is set", async () => {
    const ctx = setup();

    await invoke(ctx.command, { all: true, status: undefined });

    expect(ctx.wasCalled()).toBe(true);
    expect(ctx.getFilter()).toBeUndefined();
  });

  it("maps --status to the matching filter", async () => {
    const ctx = setup();

    await invoke(ctx.command, { all: false, status: "done" });

    expect(ctx.getFilter()).toEqual({ status: "done" });
  });

  it("rejects --all combined with --status", async () => {
    const ctx = setup();

    await expect(invoke(ctx.command, { all: true, status: "done" })).rejects.toBeInstanceOf(
      UsageError,
    );
  });
});
