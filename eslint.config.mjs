import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// Flat config for ESLint 9 + Next 15 (eslint-config-next is still eslintrc-style).
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  {
    ignores: [
      "node_modules/**", ".next/**", ".next-dev/**", ".next-audit-backup/**", "out/**", ".vercel/**",
      "next-env.d.ts", "farmhouse-marketplace/**", "new logo and favivcon/**", "public/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Plain Node scripts are CommonJS.
    files: ["scripts/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
