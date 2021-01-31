import * as React from "react";
import * as ReactDOM from "react-dom";
import {Link, Switch, Route, BrowserRouter as Router} from "react-router-dom";

import EditorPage from "./editor/editor-page";
import ZipperEditorPage from "./zipper-editor/zipper-editor-page";
import HandwritingPage from "./handwriting/handwriting-page";
import SolverPage from "./solver/solver-page";
import TutorPage from "./tutor/tutor-page";

const container = document.createElement("div");

if (document.body) {
    document.body.appendChild(container);
}

ReactDOM.render(
    <Router>
        <Switch>
            <Route path="/zipper-editor">
                <ZipperEditorPage />
            </Route>
            <Route path="/editor-test">
                <EditorPage />
            </Route>
            <Route path="/handwriting">
                <HandwritingPage />
            </Route>
            <Route path="/auto-solver">
                <SolverPage />
            </Route>
            <Route path="/tutor">
                <TutorPage />
            </Route>
            <Route path="/">
                <h1>MathBlocks Demos</h1>
                <ul>
                    <li>
                        <Link to="/zipper-editor">Zipper Editor</Link>
                    </li>
                    <li>
                        <Link to="/editor-test">Editor test</Link>
                    </li>
                    <li>
                        <Link to="/handwriting">Handwriting input</Link>
                    </li>
                    <li>
                        <Link to="/auto-solver">Auto-solver</Link>
                    </li>
                    <li>
                        <Link to="/tutor">Tutor</Link>
                    </li>
                </ul>
            </Route>
        </Switch>
    </Router>,
    container,
);
