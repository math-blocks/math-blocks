module.exports = {
    extends: [
        "plugin:import/typescript",
        "plugin:react-hooks/recommended",
        "typescript",
        "typescript/react",
    ],
    plugins: [
        "flowtype",
        "import",
        "jest",
        "react-hooks",
        "react",
        "workspaces",
    ],
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            rules: {
                "@typescript-eslint/array-type": "error",
                "@typescript-eslint/prefer-ts-expect-error": "warn",
                "@typescript-eslint/prefer-optional-chain": "error",
                "@typescript-eslint/no-use-before-define": "off",
                "@typescript-eslint/explicit-function-return-type": [
                    "warn",
                    {allowExpressions: true},
                ],
                "@typescript-eslint/interface-name-prefix": "off",
                "@typescript-eslint/no-unused-vars": [
                    "error",
                    // NOTE: args: "after-used" doens't work for some reason
                    {args: "none"},
                ],
            },
        },
    ],
    rules: {
        "comma-dangle": ["error", "always-multiline"],
        "no-prototype-builtins": "off",
        // TODO: add 'main' fields to all package.json files before re-enabling
        // "import/no-unused-modules": ["error", {"unusedExports": true}],
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "react/prop-types": "off",
        "react-hooks/exhaustive-deps": "error",
        "workspaces/no-absolute-imports": "error",
        "workspaces/no-relative-imports": "error",
        "workspaces/require-dependency": "error",
    },
    env: {
        jest: true,
        es6: true,
        browser: true,
        node: true,
    },
    parserOptions: {ecmaVersion: 2018},
    settings: {react: {version: "detect"}},
};
