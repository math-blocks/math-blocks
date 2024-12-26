import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider, Link } from 'react-router-dom';

import BaselinePage from './basline/baseline-page';
import EditorPage from './editor/editor-page';
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

const Homepage = () => {
  return (
    <div>
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
        <li>
          <Link to="/react-native">React Native</Link>
        </li>
      </ul>
    </div>
  );
};

const router = createHashRouter(
  [
    {
      path: '/',
      Component: Homepage,
    },
    {
      path: '/baseline',
      Component: BaselinePage,
    },
    {
      path: '/editor',
      Component: EditorPage,
    },
    {
      path: '/parser',
      Component: ParserPage,
    },
    {
      path: '/mathml',
      Component: MathmlPage,
    },
    {
      path: '/handwriting',
      Component: HandwritingPage,
    },
    {
      path: '/auto-solver',
      Component: SolverPage,
    },
    {
      path: '/opentype-demo',
      Component: OpenTypeDemo,
    },
    {
      path: '/svg',
      Component: SvgPage,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

const root = createRoot(container);
root.render(<RouterProvider router={router} />);

console.log('hello, world!');
