/**
 * エラー種別を表す機械可読コード。`--json` 出力の `error.code` と一致する。
 */
export type ErrorCode = "USAGE" | "NOT_FOUND" | "STORAGE" | "INTERNAL";

/**
 * アプリのドメインエラー基底クラス。種別ごとのサブクラスが `code` を固定する。
 * `app/exit.ts` がこの `code` を終了コードと JSON エラー payload へ変換する。
 */
export class AppError extends Error {
  code: ErrorCode;

  /**
   * @param code - エラー種別コード。
   * @param message - 人間向けのエラーメッセージ。
   */
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

/**
 * 不正な引数・必須引数不足・数値でない ID など、使用法の誤り。終了コード 2。
 */
export class UsageError extends AppError {
  /**
   * @param message - 人間向けのエラーメッセージ。
   */
  constructor(message: string) {
    super("USAGE", message);
  }
}

/**
 * 指定 ID の todo が存在しない。終了コード 1。
 */
export class NotFoundError extends AppError {
  /**
   * @param message - 人間向けのエラーメッセージ。
   */
  constructor(message: string) {
    super("NOT_FOUND", message);
  }
}

/**
 * 永続化に起因するエラー（JSON parse 失敗・schema 不正・権限不足・未知 version 等）。
 * 終了コード 1。
 */
export class StorageError extends AppError {
  /**
   * @param message - 人間向けのエラーメッセージ。
   */
  constructor(message: string) {
    super("STORAGE", message);
  }
}

/**
 * コマンド / core 層のバグに起因する不正状態（不変条件違反など）。終了コード 1。
 */
export class InternalError extends AppError {
  /**
   * @param message - 人間向けのエラーメッセージ。
   */
  constructor(message: string) {
    super("INTERNAL", message);
  }
}
