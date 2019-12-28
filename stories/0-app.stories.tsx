import React from "react";

import App from "../src/app";

export default {
    title: "App",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const app: React.SFC<{}> & {parameters: any} = () => <App />;

app.parameters = {
    chromatic: {
        ignore: true,
    },
};
