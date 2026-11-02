import type { languages } from "monaco-editor";

export const wrhLanguageConfig: languages.LanguageConfiguration = {
  comments: {
    lineComment: "#",
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
};

export const wrhMonarchTokensProvider: languages.IMonarchLanguage = {
  defaultToken: "invalid",
  keywords: [
    "digit",
    "verify",
    "textbody",
    "when",
    "otherwise",
    "until",
    "flex",
    "yes",
    "no",
  ],
  operators: [
    ":=",
    "+++",
    "---",
    "//",
    "**",
    "?=",
    ">>",
    "<<",
    "~",
  ],
  tokenizer: {
    root: [
      // Identifiers & keywords
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier",
          },
        },
      ],

      // Whitespace
      { include: "@whitespace" },

      // Delimiters and operators
      [/[{}()\[\]]/, "@brackets"],
      [/;/, "delimiter"],
      [/:=|\+\+\+|---|(?:\/\/)|(?:\*\*)|(?:\?=)|>>|<<|~/, "operator"],

      // Numbers
      [/\d+/, "number"],

      // Strings
      [/"([^"\\]|\\.)*"/, "string"],
    ],
    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/#.*$/, "comment"],
    ],
  },
};
