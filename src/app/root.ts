import { readFileSync } from "node:fs";

type PackageJson = {
  version: string;
};

export type RootCommand = {
  meta: {
    name: string;
    description: string;
    version: string;
  };
};

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as PackageJson;

export const rootCommand: RootCommand = {
  meta: {
    name: "clido",
    description: "ローカルファーストな todo 管理 CLI",
    version: packageJson.version,
  },
};
