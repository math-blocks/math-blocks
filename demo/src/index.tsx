import * as React from "react";
import * as ReactDOM from "react-dom";
import {Link, Switch, Route, BrowserRouter as Router} from "react-router-dom";

import TutorPage from "./tutor/tutor-page";
import EditorPage from "./editor/editor-page";
import HandwritingPage from "./handwriting/handwriting-page";

const container = document.createElement("div");

if (document.body) {
    document.body.appendChild(container);
}

ReactDOM.render(
    <Router>
        <Switch>
            <Route path="/tutor">
                <TutorPage />
            </Route>
            <Route path="/editor">
                <EditorPage />
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
                        <Link to="/tutor">Tutor</Link>
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
