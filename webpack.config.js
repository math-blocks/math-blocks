const path = require("path");
var HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "development",
    entry: {
        index: "./demo/src/index.tsx",
    },
    output: {
        publicPath: "/",
        filename: "[name].bundle.js",
        chunkFilename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html",
            title: "math-toolbox",
        }),
    ],
    resolve: {
        extensions: [".js", ".json", ".ts", ".tsx"],
        alias: {
            "react-dom": "@hot-loader/react-dom",
            // TODO: replace these aliases with NormalModuleReplacementPlugin
            "@math-blocks/core": path.join(__dirname, "./packages/core/src"),
            "@math-blocks/editor-core": path.join(
                __dirname,
                "./packages/editor-core/src",
            ),
            "@math-blocks/grader": path.join(
                __dirname,
                "./packages/grader/src",
            ),
            "@math-blocks/metrics": path.join(
                __dirname,
                "./packages/metrics/src",
            ),
            "@math-blocks/parser-factory": path.join(
                __dirname,
                "./packages/parser-factory/src",
            ),
            "@math-blocks/react": path.join(__dirname, "./packages/react/src"),
            "@math-blocks/schema": path.join(
                __dirname,
                "./packages/schema/src",
            ),
            "@math-blocks/semantic": path.join(
                __dirname,
                "./packages/semantic/src",
            ),
            "@math-blocks/solver": path.join(
                __dirname,
                "./packages/solver/src",
            ),
            "@math-blocks/testing": path.join(
                __dirname,
                "./packages/testing/src",
            ),
            "@math-blocks/typesetter": path.join(
                __dirname,
                "./packages/typesetter/src",
            ),
        },
    },
    devtool: "source-map",
    devServer: {
        hot: true,
        liveReload: false,
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 9000,
        host: "0.0.0.0",
        disableHostCheck: true,
        historyApiFallback: true,
    },
};
