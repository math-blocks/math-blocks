const path = require("path");
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: "development",
    entry: {
        "index": "./src/index.ts",
    },
    output: {
        publicPath: "dist/",
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [
            {
                test: /\.ts[x]*$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                }
            },
        ]
    },
    plugins: [new HtmlWebpackPlugin()],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    devtool: "source-map",
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
    },
};
