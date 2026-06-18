import { describe, expect, it } from "vitest";
import { createClearCommand } from "../../src/commands/clear.ts";
import { invoke, makeContext, makeFakeRepo, makeOutput } from "../support.ts";

const fixed = new Date("2026-06-16T12:00:00.000Z");

describe("clear command", () => {
  it("deletes completed todos via deleteCompleted and reports the count", async () => {
    let called = false;
    const repo = makeFakeRepo({
      deleteCompleted: async () => {
        called = true;
        return 3;
      },
    });
    const { output, captured } = makeOutput();
    const command = createClearCommand({ getContext: () => makeContext(repo, output, fixed) });

    await invoke(command, {});

    expect(called).toBe(true);
    expect(captured.successes).toEqual([{ cleared: 3 }]);
  });

  it("reports zero when there is nothing to clear", async () => {
    const repo = makeFakeRepo({ deleteCompleted: async () => 0 });
    const { output, captured } = makeOutput();
    const command = createClearCommand({ getContext: () => makeContext(repo, output, fixed) });

    await invoke(command, {});

    expect(captured.successes).toEqual([{ cleared: 0 }]);
  });
});
