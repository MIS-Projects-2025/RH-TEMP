import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    files: ["**/*.{js,jsx,mjs,cjs}"],
    plugins: { react: pluginReact },
    rules: {
      semi: ["warn", "always"],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
    globals: { route: "readonly" },
    languageOptions: { globals: globals.browser },
    extends: [js.configs.recommended, pluginReact.configs.flat.recommended],
  },
]);