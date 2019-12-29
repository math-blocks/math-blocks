import {addParameters, configure} from "@storybook/react";

configure(
    require.context("../stories", true, /\.stories\.(tsx|mdx)?$/),
    module,
);

addParameters({
    options: {
        enableShortcuts: false,
    },
});
