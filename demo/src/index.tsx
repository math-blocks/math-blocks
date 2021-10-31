import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link, Switch, Route, HashRouter as Router } from 'react-router-dom';

import EditorPage from './editor/editor-page';
import SimpleEditorPage from './editor/simple-editor-page';
import MathmlPage from './mathml/mathml-page';
import HandwritingPage from './handwriting/handwriting-page';
import SolverPage from './solver/solver-page';
import OpenTypeDemo from './opentype/opentype-demo';
import TutorPage from './tutor/tutor-page';

const container = document.createElement('div');

if (document.body) {
  document.body.appendChild(container);
}

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/editor">
        <EditorPage />
      </Route>
      <Route path="/simple-editor">
        <SimpleEditorPage />
      </Route>
      <Route path="/mathml">
        <MathmlPage />
      </Route>
      <Route path="/handwriting">
        <HandwritingPage />
      </Route>
      <Route path="/auto-solver">
        <SolverPage />
      </Route>
      <Route path="/opentype-demo">
        <OpenTypeDemo />
      </Route>
      <Route path="/tutor">
        <TutorPage />
      </Route>
      <Route path="/">
        <h1>MathBlocks Demos</h1>
        <ul>
          <li>
            <Link to="/editor">Editor</Link>
          </li>
          <li>
            <Link to="/simple-editor">Simple Editor</Link>
          </li>
          <li>
            <Link to="/mathml">Mathml</Link>
          </li>
          <li>
            <Link to="/handwriting">Handwriting input</Link>
          </li>
          <li>
            <Link to="/auto-solver">Auto-solver</Link>
          </li>
          <li>
            <Link to="/opentype-demo">OpenType Demo</Link>
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
