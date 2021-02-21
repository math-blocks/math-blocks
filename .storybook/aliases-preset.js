const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const webpackConfig = require(path.resolve(__dirname, "../webpack.config.js"));

module.exports = {
    managerWebpack: async (config, options) => {
        // update config here
        return config;
    },
    managerBabel: async (config, options) => {
        // update config here
        return config;
    },
    webpackFinal: async (config, options) => {
        config.resolve.alias = Object.assign(
            config.resolve.alias,
            webpackConfig.resolve.alias,
        );
        config.module.rules = webpackConfig.module.rules;
        config.plugins.push(new MiniCssExtractPlugin());
        return config;
    },
    babel: async (config, options) => {
        return config;
    },
    addons: [],
};
