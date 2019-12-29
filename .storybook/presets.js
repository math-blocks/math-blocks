const path = require("path");

module.exports = [
    {
        name: "@storybook/preset-typescript",
        options: {
            include: [
                path.resolve(__dirname, "../src"),
                path.resolve(__dirname, "../stories"),
            ],
            tsDocgenLoaderOptions: {
                docgenCollectionName: "STORYBOOK_REACT_CLASSES",
            },
        },
    },
    "@storybook/addon-docs/preset",
];
