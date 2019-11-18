// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./app";
import reducer from "./reducer";

const container = document.createElement("div");

if (document.body) {
    document.body.appendChild(container);
}

ReactDOM.render(<App />, container);
