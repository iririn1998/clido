import { describe, expect, it } from "vitest";
import { rootMeta } from "../src/app/root.ts";
import { runCli } from "../src/cli.ts";

describe("runCli", () => {
  it("prints the root command version", async () => {
    const lines: string[] = [];

    const exitCode = await runCli(["node", "clido", "--version"], {
      writeLine: (message) => {
        lines.push(message);
      },
    });

    expect(exitCode).toBe(0);
    expect(lines).toEqual([rootMeta.version]);
  });

  it("renders usage for the help command", async () => {
    const lines: string[] = [];

    const exitCode = await runCli(["node", "clido", "help"], {
      writeLine: (message) => {
        lines.push(message);
      },
    });

    expect(exitCode).toBe(0);
    expect(lines.join("\n")).toContain("USAGE");
    expect(lines.join("\n")).toContain(rootMeta.name);
  });
});
