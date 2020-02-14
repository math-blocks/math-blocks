const path = require("path");
var HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "development",
    entry: {
        index: "./packages/demo/src/index.tsx",
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
            "@math-blocks/core": path.join(__dirname, "./packages/core/src"),
            "@math-blocks/editor": path.join(
                __dirname,
                "./packages/editor/src",
            ),
            "@math-blocks/react": path.join(__dirname, "./packages/react/src"),
            "@math-blocks/semantic": path.join(
                __dirname,
                "./packages/semantic/src",
            ),
            "@math-blocks/step-checker": path.join(
                __dirname,
                "./packages/step-checker/src",
            ),
            "@math-blocks/parser": path.join(
                __dirname,
                "./packages/parser/src",
            ),
            "@math-blocks/editor-parser": path.join(
                __dirname,
                "./packages/editor-parser/src",
            ),
            "@math-blocks/text-parser": path.join(
                __dirname,
                "./packages/text-parser/src",
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
        historyApiFallback: true,
    },
};
