import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "out 2/**",
    "build/**",
    ".netlify/**",
    "next-env.d.ts",
    // scripts/ はNext.jsアプリ外のユーティリティ
    "scripts/**",
  ]),
]);

export default eslintConfig;
