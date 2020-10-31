module.exports = {
    extends: ["typescript", "typescript/react"],
    plugins: ["flowtype", "jest", "react"],
    rules: {
        "no-prototype-builtins": "off",
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "react/prop-types": "off",
        "@typescript-eslint/ban-ts-ignore": "warn",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/explicit-function-return-type": [
            "warn",
            {allowExpressions: true},
        ],
        "@typescript-eslint/interface-name-prefix": [
            "error",
            {prefixWithI: "always"},
        ],
        "@typescript-eslint/no-unused-vars": [
            "error",
            // NOTE: args: "after-used" doens't work for some reason
            {args: "none"},
        ],
    },
    env: {
        jest: true,
        es6: true,
        browser: true,
        node: true,
    },
};
