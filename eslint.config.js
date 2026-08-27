import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["build", "dist"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      /*
       * eslint-plugin-react-hooks v7 turns the React Compiler rules on as
       * errors. The calculator pages derive state inside effects in ~12 places,
       * which predates this upgrade and needs a real refactor to fix, so this
       * stays a warning until those pages are reworked.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  }
);
