import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "jsdoc"],
  jsPlugins: [{ name: "jsdoc-js", specifier: "eslint-plugin-jsdoc" }],
  categories: {
    correctness: "error",
  },
  env: {
    builtin: true,
    node: true,
  },
  overrides: [
    {
      files: ["src/**/*.{ts,tsx,mts,cts}"],
      rules: {
        "func-style": ["error", "expression"],
        "prefer-arrow-callback": "error",
        "arrow-body-style": "error",

        /**
         * JSDoc Rules
         */
        "jsdoc-js/require-jsdoc": [
          "error",
          {
            require: {
              FunctionExpression: true,
              ArrowFunctionExpression: true,
              MethodDefinition: true,
              ClassDeclaration: true,
              ClassExpression: true,
            },
          },
        ],
        "jsdoc/check-access": "error",
        "jsdoc/empty-tags": "error",
        "jsdoc/require-param": "error",
        "jsdoc/require-param-description": "error",
        "jsdoc/require-param-name": "error",
        "jsdoc/require-returns": "error",
        "jsdoc/require-returns-description": "error",
        "jsdoc/require-yields-description": "error",
      },
    },
  ],
});
