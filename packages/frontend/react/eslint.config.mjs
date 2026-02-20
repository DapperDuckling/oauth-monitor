import { defineConfig } from "eslint/config";

export default defineConfig([{
    languageOptions: {
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: ["./tsconfig.json"],
        },
    },
}]);