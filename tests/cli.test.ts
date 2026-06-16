import { describe, expect, it } from "vitest";
import { rootMeta } from "../src/app/root.ts";
import { runCli } from "../src/cli.ts";
import type { Io } from "../src/infra/output.ts";

const captureIo = (): { io: Io; out: string[]; err: string[] } => {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: {
      writeOut: (message) => {
        out.push(message);
      },
      writeErr: (message) => {
        err.push(message);
      },
    },
    out,
    err,
  };
};

describe("runCli", () => {
  it("prints the root command version", async () => {
    const { io, out } = captureIo();

    const exitCode = await runCli(["node", "clido", "--version"], io);

    expect(exitCode).toBe(0);
    expect(out).toEqual([rootMeta.version]);
  });

  it("renders usage for the help command", async () => {
    const { io, out } = captureIo();

    const exitCode = await runCli(["node", "clido", "help"], io);

    expect(exitCode).toBe(0);
    expect(out.join("\n")).toContain("USAGE");
    expect(out.join("\n")).toContain(rootMeta.name);
  });

  it("rejects unknown flags as a usage error", async () => {
    const { io, err } = captureIo();

    const exitCode = await runCli(["node", "clido", "list", "--nope"], io);

    expect(exitCode).toBe(2);
    expect(err.join("\n")).toContain("未知のオプション");
  });
});
