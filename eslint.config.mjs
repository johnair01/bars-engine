import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "warn",
      "@next/next/no-assign-module-variable": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent worktrees and generated files:
    ".claude/**",
    "prisma/generated/**",
    // Vendor / third-party dirs:
    "LibreSprite/**",
    "backend/.venv/**",
    // Design handoff bundle — vendored reference material, not project source:
    "design/**",
    // Ontology Alchemy Game: browser-global React source carried over from its claude.ai
    // artifact, compiled by scripts/build-ontology-game.mjs, not part of the Next app:
    "content/ontology-game/**",
  ]),
]);

export default eslintConfig;
