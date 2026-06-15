import { defineCommand } from "citty";
import { readFileSync } from "node:fs";

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
 * Root command definition. Holds shared meta and, later, the subcommand
 * registry. Subcommands are attached via `subCommands` so citty handles
 * dispatch and help generation; `cli.ts` keeps version/help/banner special
 * cases per the architecture's exit-code contract.
 */
export const rootCommand = defineCommand({
  meta: rootMeta,
});
