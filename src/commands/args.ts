import { UsageError } from "../core/errors.ts";

/**
 * positional の id 引数を正の整数へ変換する。citty の positional は文字列で渡るため、
 * 正の整数表記（先頭ゼロ・小数・指数表記・符号を含まない）でなければ `UsageError`
 * （終了コード 2）。安全整数の範囲外も `UsageError` で弾く。
 *
 * @param raw - citty が渡す id の生値。
 * @returns 検証済みの正の整数 id。
 */
export const parseId = (raw: unknown): number => {
  const text = String(raw ?? "").trim();
  if (!/^[1-9][0-9]*$/.test(text)) {
    throw new UsageError(`id は正の整数で指定してください: ${text === "" ? "(未指定)" : text}`);
  }
  const id = Number(text);
  if (!Number.isSafeInteger(id)) {
    throw new UsageError(`id が大きすぎます: ${text}`);
  }
  return id;
};
