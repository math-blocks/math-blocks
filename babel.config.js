module.exports = {
    presets: ["@babel/preset-env", "@babel/react", "@babel/flow"],
    plugins: [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-optional-chaining",
        "@babel/plugin-proposal-nullish-coalescing-operator",
    ],
};
