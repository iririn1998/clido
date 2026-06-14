import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc"],
  categories: {
    correctness: "error",
  },
  env: {
    builtin: true,
    node: true,
    es2024: true,
  },
  // アロー関数を基本とする方針はアプリ本体(src)にのみ適用する。
  // ルート直下の設定ファイル(commitlint.config.ts 等)は対象外にする。
  overrides: [
    {
      files: ["src/**/*.{ts,tsx,mts,cts}"],
      rules: {
        // アロー関数を基本とする: 関数宣言を禁止し関数式(=アロー)を強制
        "func-style": ["error", "expression"],
        // コールバックはアロー関数に統一
        "prefer-arrow-callback": "error",
        // アロー関数の本体は不要な波括弧を省く
        "arrow-body-style": ["error", "as-needed"],
      },
    },
  ],
});
