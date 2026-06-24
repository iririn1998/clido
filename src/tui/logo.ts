import cfonts from "cfonts";
import { rootMeta } from "../app/root.ts";

/**
 * `clido` のロゴを cfonts で1度だけ生成し、行配列へ整形した結果。各要素に埋め込まれた
 * 改行を取り除き空行を落とすことで、対話モードの CRLF 連結描画や非 TTY バナーへ
 * そのまま差し込める（色付けの ANSI エスケープは保持する）。モジュール読み込み時に
 * 一度だけ評価し、フレーム再描画のたびに作り直さない。
 */
const rendered = cfonts.render(rootMeta.name, {
  font: "block",
  align: "left",
  colors: ["cyan", "blue"],
  space: false,
});

export const logoLines: readonly string[] = (rendered === false ? [] : rendered.array)
  .map((line: string) => line.replace(/\n/g, ""))
  .filter((line: string) => line.trim().length > 0);
