import * as React from "react";
import * as ReactDOM from "react-dom";
import {Switch, Route, BrowserRouter as Router} from "react-router-dom";

import App from "./app";
import EditorPage from "./editor-page";
import RendererPage from "./renderer-page";

const container = document.createElement("div");

if (document.body) {
    document.body.appendChild(container);
}

ReactDOM.render(
    <Router>
        <Switch>
            <Route path="/app">
                <App />
            </Route>
            <Route path="/editor">
                <EditorPage />
            </Route>
            <Route path="/renderer">
                <RendererPage />
            </Route>
            <Route path="/">
                <h1>MathBlocks demos</h1>
                <ul>
                    <li>
                        <a href="/editor">Editor</a>
                    </li>
                    <li>
                        <a href="/renderer">Renderer</a>
                    </li>
                </ul>
            </Route>
        </Switch>
    </Router>,
    container,
);
