import { InternalError, StorageError } from "../core/errors.ts";
import type { Todo, TodoStatus } from "../core/todo.ts";

/**
 * 現行の永続化スキーマ version。`migrations.ts` はこの値を終点に正規化する。
 */
export const SCHEMA_VERSION = 1;

/**
 * 永続化ファイルの形。`nextId` は採番状態の正であり repository だけが扱う。
 */
export type StorageFile = {
  version: number;
  nextId: number;
  todos: Todo[];
};

/**
 * 新規ファイル用の空状態を返す。
 *
 * @returns 空の `StorageFile`（`nextId` は 1）。
 */
export const emptyStorage = (): StorageFile => ({
  version: SCHEMA_VERSION,
  nextId: 1,
  todos: [],
});

/**
 * 値が（配列でない）プレーンオブジェクトか判定する。
 *
 * @param value - 判定対象。
 * @returns レコードなら `true`。
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * 値が解析可能な ISO 8601 文字列か判定する。
 *
 * @param value - 判定対象。
 * @returns 妥当な日時文字列なら `true`。
 */
const isIsoString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));

const STATUSES: readonly TodoStatus[] = ["open", "done"];

/**
 * 値が許可された `TodoStatus` か判定する。
 *
 * @param value - 判定対象。
 * @returns `open` / `done` のいずれかなら `true`。
 */
const isStatus = (value: unknown): value is TodoStatus =>
  typeof value === "string" && (STATUSES as readonly string[]).includes(value);

/**
 * 単一 todo を検証して型付けする。壊れた永続化データへの防御として、
 * 空 title・不正 status・不正 ISO 日時・status と completedAt の不整合を拒否する。
 *
 * @param value - 検証対象の生の値。
 * @param index - エラーメッセージ用の配列インデックス。
 * @returns 検証済みの `Todo`。
 */
const parseTodo = (value: unknown, index: number): Todo => {
  const at = `todos[${index}]`;
  if (!isRecord(value)) {
    throw new StorageError(`${at} がオブジェクトではありません。`);
  }
  if (typeof value.id !== "number" || !Number.isInteger(value.id) || value.id <= 0) {
    throw new StorageError(`${at}.id が正の整数ではありません。`);
  }
  if (typeof value.title !== "string" || value.title.trim().length === 0) {
    throw new StorageError(`${at}.title が空です。`);
  }
  if (!isStatus(value.status)) {
    throw new StorageError(`${at}.status が不正です。`);
  }
  if (!isIsoString(value.createdAt)) {
    throw new StorageError(`${at}.createdAt が不正な日時です。`);
  }
  if (!isIsoString(value.updatedAt)) {
    throw new StorageError(`${at}.updatedAt が不正な日時です。`);
  }
  if (value.completedAt !== null && !isIsoString(value.completedAt)) {
    throw new StorageError(`${at}.completedAt が不正な日時です。`);
  }
  if (value.status === "open" && value.completedAt !== null) {
    throw new StorageError(`${at} は open なのに completedAt が設定されています。`);
  }
  if (value.status === "done" && value.completedAt === null) {
    throw new StorageError(`${at} は done なのに completedAt が null です。`);
  }
  return {
    id: value.id,
    title: value.title,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    completedAt: value.completedAt,
  };
};

/**
 * パース済み JSON を検証して `StorageFile` にする。未知 version・型不正・
 * 重複 ID を `StorageError` として拒否する。
 *
 * @param value - `JSON.parse` 済みの生の値。
 * @returns 検証済みの `StorageFile`。
 */
export const parseStorage = (value: unknown): StorageFile => {
  if (!isRecord(value)) {
    throw new StorageError("永続化ファイルがオブジェクトではありません。");
  }
  if (value.version !== SCHEMA_VERSION) {
    throw new StorageError(`未知の schema version です: ${String(value.version)}`);
  }
  if (typeof value.nextId !== "number" || !Number.isInteger(value.nextId) || value.nextId <= 0) {
    throw new StorageError("nextId が正の整数ではありません。");
  }
  if (!Array.isArray(value.todos)) {
    throw new StorageError("todos が配列ではありません。");
  }

  const todos = value.todos.map(parseTodo);
  const seen = new Set<number>();
  for (const todo of todos) {
    if (seen.has(todo.id)) {
      throw new StorageError(`todo の id が重複しています: ${todo.id}`);
    }
    seen.add(todo.id);
  }

  return { version: SCHEMA_VERSION, nextId: value.nextId, todos };
};

/**
 * 読み込み時の `nextId` 補正。手編集などで `nextId <= max(id)` になっていても、
 * メモリ上で `max(id) + 1` へ引き上げる。ディスクへの確定は次の書き込みに委ねる。
 *
 * @param storage - 読み込み済みの状態。
 * @returns `nextId` を補正した状態（補正不要ならそのまま返す）。
 */
export const normalizeNextId = (storage: StorageFile): StorageFile => {
  const maxId = storage.todos.reduce((max, todo) => Math.max(max, todo.id), 0);
  const nextId = Math.max(storage.nextId, maxId + 1);
  return nextId === storage.nextId ? storage : { ...storage, nextId };
};

/**
 * 保存直前の不変条件チェック。`change(todo)` が不変条件を壊した場合など、
 * コマンド / core 層のバグに由来する不正状態は `InternalError` として弾く。
 *
 * @param storage - 保存しようとしている状態。
 */
export const assertStorageInvariants = (storage: StorageFile): void => {
  const seen = new Set<number>();
  for (const todo of storage.todos) {
    if (todo.title.trim().length === 0) {
      throw new InternalError(`保存しようとした todo の title が空です: id=${todo.id}`);
    }
    if (todo.status === "open" && todo.completedAt !== null) {
      throw new InternalError(`open な todo に completedAt が設定されています: id=${todo.id}`);
    }
    if (todo.status === "done" && todo.completedAt === null) {
      throw new InternalError(`done な todo の completedAt が null です: id=${todo.id}`);
    }
    if (seen.has(todo.id)) {
      throw new InternalError(`保存しようとした todo の id が重複しています: ${todo.id}`);
    }
    seen.add(todo.id);
  }
};
