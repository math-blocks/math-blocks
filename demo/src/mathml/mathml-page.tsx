import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import { FontDataContext } from '@math-blocks/react';
import { getFontData, parse } from '@math-blocks/opentype';
import type { Font } from '@math-blocks/opentype';

import AccessibleMath from './accessible-math';

const { row, char, frac, root } = Editor.builders;

const MathmlPage: React.FunctionComponent = () => {
  const linearEquation = Editor.util.row('2x+5=10');
  const pythagoras = row([
    char('a'),
    Editor.util.sup('2'),
    char('+'),
    char('b'),
    Editor.util.sup('2'),
    char('='),
    char('c'),
    Editor.util.sup('2'),
  ]);
  const quadraticEquation = row([
    char('x'),
    char('='),
    frac(
      [
        char('\u2212'),
        char('b'),
        char('\u00B1'),
        root(null, [
          char('b'),
          Editor.util.sup('2'),
          char('\u2212'),
          char('4'),
          char('a'),
          char('c'),
        ]),
      ],
      [char('2'), char('a')],
    ),
  ]);

  const factoring = Editor.builders.row([
    Editor.builders.delimited(
      Editor.util.row('x-1').children,
      Editor.builders.char('('),
      Editor.builders.char(')'),
    ),
    Editor.builders.delimited(
      Editor.util.row('x+1').children,
      Editor.builders.char('('),
      Editor.builders.char(')'),
    ),
    Editor.builders.char('='),
    Editor.builders.char('0'),
  ]);

  const [font, setFont] = React.useState<Font | null>(null);

  React.useEffect(() => {
    const loadFont = async (): Promise<void> => {
      const res = await fetch('/STIX2Math.otf');
      const blob = await res.blob();
      const font = await parse(blob);
      console.log(font);
      setFont(font);
    };

    loadFont();
  }, []);

  if (!font) {
    return null;
  }

  const fontData = getFontData(font, 'STIX2');

  return (
    <FontDataContext.Provider value={fontData}>
      <h1>MathML Test Page</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          rowGap: 60,
        }}
      >
        <h2>Linear Equation</h2>
        <AccessibleMath math={linearEquation} />
        <h2>Pythagoras Theorem</h2>
        <AccessibleMath math={pythagoras} />
        <h2>Quadratic Equation</h2>
        <AccessibleMath math={quadraticEquation} />
        <h2>Factoring</h2>
        <AccessibleMath math={factoring} />
      </div>
    </FontDataContext.Provider>
  );
};

export default MathmlPage;
