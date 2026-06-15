import { describe, expect, it } from "vitest";
import { rootCommand } from "../src/app/root.ts";
import { runCli } from "../src/cli.ts";

describe("runCli", () => {
  it("prints the root command version", () => {
    const lines: string[] = [];

    const exitCode = runCli(["node", "clido", "--version"], {
      writeLine: (message) => {
        lines.push(message);
      },
    });

    expect(exitCode).toBe(0);
    expect(lines).toEqual([rootCommand.meta.version]);
  });
});
