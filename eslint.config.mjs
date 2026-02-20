import { defineConfig } from "eslint/config";
import importX from "eslint-plugin-import-x";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends(
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:import-x/recommended",
    ),

    plugins: {
        "import-x": importX,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: ["./tsconfig.json"],
        },
    },

    settings: {
        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
            },

            node: {
                extensions: [".js", ".ts", ".tsx"],
            },
        },
    },

    rules: {
        "import-x/no-unresolved": "off",

        "@typescript-eslint/strict-boolean-expressions": ["warn", {
            allowString: true,
            allowNumber: true,
            allowNullableObject: true,
            allowNullableBoolean: true,
            allowNullableString: true,
            allowNullableNumber: true,
            allowNullableEnum: true,
        }],

        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/require-await": "off",

        "@typescript-eslint/no-misused-promises": ["error", {
            checksVoidReturn: {
                arguments: false,
                attributes: false,
            },
        }],

        "import-x/extensions": ["error", "ignorePackages", {
            js: "always",
            ts: "never",
            tsx: "never",
        }],
    },
}]);