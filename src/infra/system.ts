/**
 * 現在時刻を返す唯一の副作用ヘルパー。`Context.now` のクロック源として使い、
 * テストでは固定の `Date` を返す関数に差し替える。
 *
 * @returns 現在時刻の `Date`。
 */
export const now = (): Date => new Date();
