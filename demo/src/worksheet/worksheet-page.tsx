// A page with lots of math on it: a worksheet of problems drawn with
// MathRenderer, and a few MathEditors for answers. Every SVG shares one set of
// glyph definitions through GlyphDefsProvider. With `?shared=0` in the URL,
// the page renders without the provider, so each SVG has its own <defs>; the
// e2e tests compare the two.
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  FontDataContext,
  GlyphDefsProvider,
  MathEditor,
  MathRenderer,
} from '@math-blocks/react';
import * as Tex from '@math-blocks/tex';

import { useFont } from '../shared/fonts';

const TEMPLATES = [
  (n: number) => `${n}x+${n + 3}=${2 * n + 7}`,
  (n: number) => `\\frac{${n}}{${n + 1}}+\\frac{1}{${n + 2}}`,
  (n: number) => `x^2−${2 * n}x+${n * n}=0`,
  (n: number) => `\\sqrt{${n * n + 1}}−${n}`,
  (n: number) => `(x+${n})(x−${n + 1})`,
];

// 40 problems that repeat the same digits, letters and operators, as a real
// worksheet would.
const PROBLEMS = Array.from({ length: 40 }, (_, i) =>
  TEMPLATES[i % TEMPLATES.length](Math.floor(i / TEMPLATES.length) + 2),
);

const EDITORS = 3;

const Worksheet: React.FunctionComponent = () => (
  <div style={{ fontFamily: 'sans-serif', margin: 16 }}>
    <h1>Worksheet</h1>
    <ol style={{ columns: 2 }}>
      {PROBLEMS.map((tex) => (
        <li key={tex} style={{ marginBottom: 12 }}>
          <MathRenderer row={Tex.parse(tex)} fontSize={24} />
        </li>
      ))}
    </ol>
    <h2>Answers</h2>
    {Array.from({ length: EDITORS }, (_, i) => (
      <div key={i} style={{ marginBottom: 8 }}>
        <MathEditor
          readonly={false}
          row={Tex.parse(`x=${i + 1}`)}
          fontSize={24}
          style={{ minWidth: 300 }}
        />
      </div>
    ))}
  </div>
);

const WorksheetPage: React.FunctionComponent = () => {
  const fontData = useFont('stix-two-math');
  const [searchParams] = useSearchParams();
  const shared = searchParams.get('shared') !== '0';

  if (!fontData) {
    return null;
  }

  return (
    <FontDataContext.Provider value={fontData}>
      {shared ? (
        <GlyphDefsProvider>
          <Worksheet />
        </GlyphDefsProvider>
      ) : (
        <Worksheet />
      )}
    </FontDataContext.Provider>
  );
};

export default WorksheetPage;
