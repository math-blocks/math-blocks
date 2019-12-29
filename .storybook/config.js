import {addParameters, configure} from "@storybook/react";

// automatically import all files ending in *.stories.js
configure(require.context("../stories", true, /\.stories\.tsx?$/), module);
addParameters({
    options: {
        enableShortcuts: false,
    },
    chromatic: {delay: 300},
});
