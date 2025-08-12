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
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      // Enhanced TypeScript rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      // React specific rules
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",
      // Performance rules
      "react/jsx-no-bind": ["warn", { "allowArrowFunctions": true }],
      // Accessibility rules
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/no-autofocus": "warn"
    }
  }
);
