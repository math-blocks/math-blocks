module.exports = {
    extends: ["typescript", "typescript/react"],
    plugins: ["flowtype", "jest", "react"],
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            rules: {
                "@typescript-eslint/ban-ts-ignore": "warn",
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
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "react/prop-types": "off",
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
