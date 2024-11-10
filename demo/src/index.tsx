import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link, Switch, Route, HashRouter as Router } from 'react-router-dom';

import BaselinePage from './basline/baseline-page';
import SimpleEditorPage from './editor/simple-editor-page';
import ParserPage from './parser/parser-page';
import MathmlPage from './mathml/mathml-page';
import HandwritingPage from './handwriting/handwriting-page';
import SolverPage from './solver/solver-page';
import OpenTypeDemo from './opentype/opentype-demo';
import SvgPage from './svg/svg-page';

const container = document.createElement('div');

if (document.body) {
  document.body.appendChild(container);
}

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/baseline">
        <BaselinePage />
      </Route>
      <Route path="/editor">
        <SimpleEditorPage />
      </Route>
      <Route path="/parser">
        <ParserPage />
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
      <Route path="/svg">
        <SvgPage />
      </Route>
      <Route path="/">
        <h1>MathBlocks Demos</h1>
        <ul>
          <li>
            <Link to="/baseline">Baseline</Link>
          </li>
          <li>
            <Link to="/editor">Editor</Link>
          </li>
          <li>
            <Link to="/parser">Parser</Link>
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
            <Link to="/svg">SVG</Link>
          </li>
        </ul>
      </Route>
    </Switch>
  </Router>,
  container,
);
