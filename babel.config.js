module.exports = {
    presets: [
        ["@babel/preset-env", {corejs: 3, targets: {node: true}}],
        "@babel/react",
        "@babel/flow",
    ],
    plugins: ["@babel/plugin-proposal-class-properties"],
};
