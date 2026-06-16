import { defineCommand } from "citty";
import type { CommandDef } from "citty";
import { readFileSync } from "node:fs";
import type { CommandDeps } from "./context.ts";
import { registry } from "./registry.ts";

type PackageJson = {
  version: string;
};

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as PackageJson;

/**
 * Resolved root metadata as a plain, typed object. citty types `meta` as a
 * `Resolvable`, so it cannot be read synchronously off the command; consumers
 * (version/help/banner in `cli.ts`) read these fields here instead.
 */
export const rootMeta = {
  name: "clido",
  description: "ローカルファーストな todo 管理 CLI",
  version: packageJson.version,
} as const;

/**
 * Builds the root command by materializing the registry into citty `subCommands`.
 * Each factory receives the same `deps` (so commands share one `getContext`), and
 * citty then handles dispatch and help generation. `--json` is declared as a root
 * global option; each subcommand also declares it so `getContext` can read
 * `args.json` regardless of citty's parent-arg merging behavior.
 *
 * @param deps - Command dependencies (notably `getContext`) injected into factories.
 * @returns The citty root command with `subCommands` materialized from the registry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createRootCommand = (deps: CommandDeps): CommandDef<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subCommands: Record<string, CommandDef<any>> = {};
  for (const [name, factory] of Object.entries(registry)) {
    subCommands[name] = factory(deps);
  }

  return defineCommand({
    meta: rootMeta,
    args: {
      json: {
        type: "boolean",
        description: "JSON で出力する",
        default: false,
      },
    },
    subCommands,
  });
};
