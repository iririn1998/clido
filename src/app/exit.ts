import { AppError, UsageError } from "../core/errors.ts";
import type { ErrorPayload, Io } from "../infra/output.ts";
import { createJsonOutput, createPlainOutput } from "../infra/output.ts";

/**
 * citty が引数解析時に投げる `CLIError`（必須引数不足・enum 不正・未知コマンド等）か判定する。
 * これらは使用法エラーへ正規化する。
 *
 * @param error - 判定対象の例外。
 * @returns citty 由来の `CLIError` なら `true`。
 */
export const isCittyError = (error: unknown): boolean =>
  error instanceof Error && error.name === "CLIError";

/**
 * エラーを終了コードへ変換する。`UsageError` と citty 由来の引数エラーは 2、
 * その他のドメインエラー・内部エラー・予期しない例外は 1。
 *
 * @param error - 変換対象の例外。
 * @returns 終了コード（2 または 1）。
 */
export const exitCodeFor = (error: unknown): number => {
  if (error instanceof UsageError || isCittyError(error)) {
    return 2;
  }
  return 1;
};

/**
 * エラーを `--json` 出力の payload へ変換する。`AppError` は自身の `code` を使い、
 * citty エラーは USAGE、それ以外は INTERNAL に分類する。
 *
 * @param error - 変換対象の例外。
 * @returns `{ code, message }` 形式のエラー payload。
 */
export const toErrorPayload = (error: unknown): ErrorPayload => {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }
  if (isCittyError(error)) {
    return { code: "USAGE", message: (error as Error).message };
  }
  if (error instanceof Error) {
    return { code: "INTERNAL", message: error.message };
  }
  return { code: "INTERNAL", message: String(error) };
};

/**
 * parse error より前でも出力形式を決められるよう、`process.argv` 相当を最小限 pre-scan する。
 * `--` に到達したら停止し、それ以前の `--json` の有無だけを見る（値解釈は citty に委ねる）。
 *
 * @param rawArgs - サブコマンド以降を含む raw 引数列。
 * @returns `--json` が指定されていれば `true`。
 */
export const prescanJson = (rawArgs: readonly string[]): boolean => {
  for (const arg of rawArgs) {
    if (arg === "--") {
      break;
    }
    if (arg === "--json") {
      return true;
    }
  }
  return false;
};

/**
 * 捕捉したエラーを整形して出力し、終了コードを返す。出力形式は pre-scan の `json` に従う。
 *
 * @param error - 捕捉した例外。
 * @param options - pre-scan 済みの `--json` 有無と出力先 writer。
 * @returns 終了コード。
 */
export const reportError = (error: unknown, options: { json: boolean; io: Io }): number => {
  const output = options.json
    ? createJsonOutput(options.io.writeOut, options.io.writeErr)
    : createPlainOutput(options.io.writeOut, options.io.writeErr);
  output.error(toErrorPayload(error));
  return exitCodeFor(error);
};
