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

// 制御文字（C0 / DEL / C1）を検出する。改行・タブを含むタイトルは plain 表示や
// TUI の1行描画を崩すため、CLI 経由でも保存前に弾く。
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;

/**
 * todo のタイトルを検証して正規化する。trim 後に非空であること、制御文字（改行・タブ・
 * その他の C0/C1）を含まないことを検査し、いずれも満たさなければ `UsageError`（終了コード 2）。
 * TUI の入力モードは `isPrintable` で弾くが、CLI 経由は無防備なため共通化してここで防ぐ。
 *
 * @param raw - citty が渡すタイトルの生値。
 * @param emptyMessage - 空のときに使うエラーメッセージ。
 * @returns trim 済みの検証済みタイトル。
 */
export const validateTitle = (raw: unknown, emptyMessage: string): string => {
  const title = String(raw ?? "").trim();
  if (title.length === 0) {
    throw new UsageError(emptyMessage);
  }
  if (CONTROL_CHARS.test(title)) {
    throw new UsageError("title に制御文字（改行・タブなど）は使用できません。");
  }
  return title;
};
