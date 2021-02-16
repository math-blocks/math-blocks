module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                corejs: 3,
                useBuiltIns: "usage",
                shippedProposals: true,
            },
        ],
        "@babel/preset-react",
        "@babel/preset-typescript",
    ],
    plugins: ["react-hot-loader/babel"],
};
