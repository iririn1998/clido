import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  it("rejects extra positional arguments as a usage error", async () => {
    const { io, err } = captureIo();

    const exitCode = await runCli(["node", "clido", "add", "foo", "bar"], io);

    expect(exitCode).toBe(2);
    expect(err.join("\n")).toContain("余分な引数");
  });

  it("rejects extra positional arguments for id commands", async () => {
    const { io, err } = captureIo();

    const exitCode = await runCli(["node", "clido", "done", "1", "2"], io);

    expect(exitCode).toBe(2);
    expect(err.join("\n")).toContain("余分な引数");
  });

  it("renders subcommand help for `<command> --help` and exits 0", async () => {
    const { io, out } = captureIo();

    const exitCode = await runCli(["node", "clido", "list", "--help"], io);

    expect(exitCode).toBe(0);
    expect(out.join("\n")).toContain("USAGE");
    expect(out.join("\n")).toContain("list");
  });

  it("renders subcommand help for `<command> -h` without requiring positionals", async () => {
    const { io, out } = captureIo();

    const exitCode = await runCli(["node", "clido", "add", "-h"], io);

    expect(exitCode).toBe(0);
    expect(out.join("\n")).toContain("USAGE");
    expect(out.join("\n")).toContain("add");
  });

  it("falls back to the banner when bare and stdin is not a TTY", async () => {
    // vitest runs with a non-TTY stdin, so the interactive list is skipped and
    // the banner guidance is printed instead of hanging on raw-mode input.
    const { io, out } = captureIo();

    const exitCode = await runCli(["node", "clido"], io);

    expect(exitCode).toBe(0);
    expect(out.join("\n")).toContain("clido help");
  });

  describe("--json position consistency", () => {
    const withDataDir = async (fn: () => Promise<void>): Promise<void> => {
      const previous = process.env.CLIDO_DATA_DIR;
      process.env.CLIDO_DATA_DIR = mkdtempSync(join(tmpdir(), "clido-cli-"));
      try {
        await fn();
      } finally {
        if (previous === undefined) {
          delete process.env.CLIDO_DATA_DIR;
        } else {
          process.env.CLIDO_DATA_DIR = previous;
        }
      }
    };

    it("emits JSON for a leading --json on the success path", async () => {
      await withDataDir(async () => {
        const { io, out } = captureIo();

        const exitCode = await runCli(["node", "clido", "--json", "list"], io);

        expect(exitCode).toBe(0);
        expect(() => JSON.parse(out.join("\n"))).not.toThrow();
      });
    });

    it("emits JSON for a trailing --json on the success path", async () => {
      await withDataDir(async () => {
        const { io, out } = captureIo();

        const exitCode = await runCli(["node", "clido", "list", "--json"], io);

        expect(exitCode).toBe(0);
        expect(() => JSON.parse(out.join("\n"))).not.toThrow();
      });
    });

    it("emits JSON errors for a leading --json on the failure path", async () => {
      await withDataDir(async () => {
        const { io, err } = captureIo();

        const exitCode = await runCli(["node", "clido", "--json", "add", ""], io);

        expect(exitCode).toBe(2);
        const parsed = JSON.parse(err.join("\n")) as { error: { code: string } };
        expect(parsed.error.code).toBe("USAGE");
      });
    });
  });
});
