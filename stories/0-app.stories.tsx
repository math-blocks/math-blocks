import React from "react";

import App from "../src/app";

export default {
    title: "App",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const app: React.SFC<{}> & {story: any} = () => <App />;

app.story = {
    name: "Test App",
    parameters: {
        chromatic: {
            disable: true,
        },
    },
};
