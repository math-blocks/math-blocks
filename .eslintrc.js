module.exports = {
    extends: [
        "typescript",
        "typescript/react",
        "typescript/prettier",
        "typescript/prettier-react",
    ],
    plugins: ["flowtype", "functional", "react"],
    rules: {
        "no-prototype-builtins": "off",
        "functional/prefer-readonly-type": [
            "error",
            {
                allowLocalMutation: true,
                allowMutableReturnType: true,
                ignoreInterface: true,
            },
        ],
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
    },
    env: {
        jest: true,
        es6: true,
        browser: true,
        node: true,
    },
};
