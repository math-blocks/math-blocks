import React from "react";

import App from "../src/app";

export default {
    title: "App",
    parameters: {
        docs: {
            disable: true,
        },
        chromatic: {
            disable: true,
        },
    },
};

export const app: React.SFC<{}> = () => <App />;
