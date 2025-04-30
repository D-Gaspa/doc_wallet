import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"
import reactNative from "eslint-plugin-react-native"

/** @type {import("eslint").Linter.Config[]} */
export default [
    { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { settings: { react: { version: "detect" } } },
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        plugins: { "react-native": reactNative },
        rules: {
            "react-native/no-unused-styles": 2,
            "react-native/split-platform-components": 2,
            "react-native/no-inline-styles": 2,
            "react-native/no-color-literals": 2,
            "react-native/no-raw-text": 2,
            "react-native/no-single-element-style-arrays": 2,
            "react/prop-types": "off",
        },
    },
    {
        ignores: ["**/node_modules/**", "ios/**", "android/**", "coverage/**"],
    },
]
