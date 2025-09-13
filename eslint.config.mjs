import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginPrettierRecommended from "eslint-config-prettier";
import reactCompiler from "eslint-plugin-react-compiler";
import path from "node:path";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prettierIgnorePath = path.resolve(__dirname, ".prettierignore");

/** @type {import('eslint').Linter.Config[]} */
export default [
  includeIgnoreFile(prettierIgnorePath),
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,

  // Custom rules for this project
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn", // Allow any but warn
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/prefer-const": "error",

      // React specific rules
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "off", // Using TypeScript for prop validation
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",

      // General code quality rules
      "no-console": "warn", // Allow console in development
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",

      // Import rules
      "no-duplicate-imports": "error",

      // Best practices
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
    },
  },

  // Configuration files (more lenient)
  {
    files: ["*.config.{js,ts,mjs}", "vite.config.*", "vitest.config.*"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "no-console": "off",
    },
  },

  // Test files
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/tests/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },

  // Electron main process files
  {
    files: ["src/main.ts", "src/preload.ts", "forge.config.ts"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "no-console": "off",
    },
  },
];
