// @flow
import * as React from "react";
import * as ReactDOM from "react-dom";
import {createStore} from "redux";
import {Provider} from "react-redux";

import App from "./app";
import reducer from "./reducer";

const container = document.createElement("div");

if (document.body) {
    document.body.appendChild(container);
}

const store = createStore(reducer);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    container,
);
