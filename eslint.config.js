import { defineConfig } from "eslint/config"

export default defineConfig({
    files: [ "**/*.ts" ],

    extends: [ "eslint:recommended" ],
    
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parserOptions: {
            project: true
        }
    },

    rules: {
        "semi": ["error", "always"]
    }
});