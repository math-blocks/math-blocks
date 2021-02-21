const path = require("path");

module.exports = {
    stories: [
        "../**/stories/**/*.stories.mdx",
        "../**/stories/**/*.stories.@(ts|tsx)",
    ],
    addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
    presets: [path.resolve(__dirname, "./aliases-preset.js")],
};
