type CommitlintParsedCommit = {
  header?: string | null;
  body?: string | null;
  footer?: string | null;
};

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "message-ascii": (parsed: CommitlintParsedCommit) => {
          const message = [parsed.header, parsed.body, parsed.footer]
            .filter(Boolean)
            .join("\n\n");

          return [
            /^[\x09\x0a\x0d\x20-\x7e]*$/.test(message),
            "commit message must be written in English (ASCII only)",
          ];
        },
      },
    },
  ],
  rules: {
    "message-ascii": [2, "always"],
  },
};
