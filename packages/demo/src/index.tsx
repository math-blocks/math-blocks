import * as React from "react";
import * as ReactDOM from "react-dom";
import {Link, Switch, Route, BrowserRouter as Router} from "react-router-dom";

import StepCheckerPage from "./step-checker-page";
import EditorPage from "./editor-page";
import MathRendererPage from "./math-renderer-page";
import HandwritingPage from "./handwriting-page";

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
            <Route path="/math-renderer">
                <MathRendererPage />
            </Route>
            <Route path="/handwriting">
                <HandwritingPage />
            </Route>
            <Route path="/">
                <h1>MathBlocks Demos</h1>
                <ul>
                    <li>
                        <Link to="/editor">Editor</Link>
                    </li>
                    <li>
                        <Link to="/math-renderer">Math Renderer</Link>
                    </li>
                    <li>
                        <Link to="/step-checker">Step Checker</Link>
                    </li>
                    <li>
                        <Link to="/handwriting">Handwriting</Link>
                    </li>
                </ul>
            </Route>
        </Switch>
    </Router>,
    container,
);
