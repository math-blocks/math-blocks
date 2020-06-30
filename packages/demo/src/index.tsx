import * as React from "react";
import * as ReactDOM from "react-dom";
import {Switch, Route, BrowserRouter as Router} from "react-router-dom";

import StepCheckerPage from "./step-checker-page";
import EditorPage from "./editor-page";
import RendererPage from "./renderer-page";
import SceneGraphPage from "./scene-graph-page";

const container = document.createElement("div");

if (document.body) {
    document.body.appendChild(container);
}

ReactDOM.render(
    <Router>
        <Switch>
            <Route path="/step-checker">
                <StepCheckerPage />
            </Route>
            <Route path="/editor">
                <EditorPage />
            </Route>
            <Route path="/renderer">
                <RendererPage />
            </Route>
            <Route path="/scene-graph">
                <SceneGraphPage />
            </Route>
            <Route path="/">
                <h1>MathBlocks Demos</h1>
                <ul>
                    <li>
                        <a href="/editor">Editor</a>
                    </li>
                    <li>
                        <a href="/renderer">Renderer</a>
                    </li>
                    <li>
                        <a href="/scene-graph">Scene Graph</a>
                    </li>
                    <li>
                        <a href="/step-checker">Step Checker</a>
                    </li>
                </ul>
            </Route>
        </Switch>
    </Router>,
    container,
);
