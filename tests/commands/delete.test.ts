import { describe, expect, it } from "vitest";
import { createDeleteCommand } from "../../src/commands/delete.ts";
import { NotFoundError, UsageError } from "../../src/core/errors.ts";
import { invoke, makeContext, makeFakeRepo, makeOutput } from "../support.ts";

const fixed = new Date("2026-06-16T12:00:00.000Z");

describe("delete command", () => {
  it("deletes the todo via delete and reports the result", async () => {
    let deletedId: number | undefined;
    const repo = makeFakeRepo({
      delete: async (id) => {
        deletedId = id;
      },
    });
    const { output, captured } = makeOutput();
    const command = createDeleteCommand({ getContext: () => makeContext(repo, output, fixed) });

    await invoke(command, { id: "1" });

    expect(deletedId).toBe(1);
    expect(captured.successes).toEqual([{ deleted: 1 }]);
  });

  it("rejects a non-numeric id with UsageError", async () => {
    const repo = makeFakeRepo();
    const { output } = makeOutput();
    const command = createDeleteCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "abc" })).rejects.toBeInstanceOf(UsageError);
  });

  it("propagates NotFoundError when the todo does not exist", async () => {
    const repo = makeFakeRepo({
      delete: async (id) => {
        throw new NotFoundError(`todo が見つかりません: #${id}`);
      },
    });
    const { output } = makeOutput();
    const command = createDeleteCommand({ getContext: () => makeContext(repo, output, fixed) });

    await expect(invoke(command, { id: "99" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
