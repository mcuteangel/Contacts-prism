import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [".next/**","node_modules/**","dist/**","out/**"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      "@next/next": nextPlugin,
      "react-refresh": reactRefresh
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "_", "varsIgnorePattern": "_" }],
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
);
