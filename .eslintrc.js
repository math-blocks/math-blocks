module.exports = {
    parser: "babel-eslint",
    plugins: ["flowtype", "react"],
    extends: "eslint:recommended",
    rules: {
        "flowtype/define-flow-type": "error",
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
    },
    env: {
        jest: true,
        es6: true,
        browser: true,
        node: true,
    },
};
