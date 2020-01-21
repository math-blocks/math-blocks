const path = require("path");
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
        return config;
    },
    babel: async (config, options) => {
        return config;
    },
    addons: [],
};
