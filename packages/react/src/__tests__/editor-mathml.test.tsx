// The Presentation MathML that MathRenderer renders, visually hidden, for
// screen readers. See https://github.com/math-blocks/math-blocks/issues/86.
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import * as Editor from '@math-blocks/editor';
import { parse as parseTex } from '@math-blocks/tex';

import { HiddenMathml } from '../editor-mathml';

const { char, row, subsup, limits, macro } = Editor.builders;

// The MathML inside <math>, without the wrapper that hides it.
const mathml = (math: Editor.types.CharRow): string => {
  const markup = ReactDOMServer.renderToStaticMarkup(
    <HiddenMathml row={math} display="block" />,
  );
  const match = /<math [^>]*>([\s\S]*)<\/math>/.exec(markup);
  if (!match) {
    throw new Error(`No <math> in ${markup}`);
  }
  return match[1];
};

const chars = (text: string): Editor.types.CharAtom[] =>
  [...text].map((c) => char(c));

describe('HiddenMathml', () => {
  test.each([
    [
      'x^2+1',
      '<mrow><msup><mi>x</mi><mrow><mn>2</mn></mrow></msup><mo>+</mo><mn>1</mn></mrow>',
    ],
    ['12.5+3', '<mrow><mn>12.5</mn><mo>+</mo><mn>3</mn></mrow>'],
    [
      '\\frac{x+1}{2}',
      '<mrow><mfrac><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mrow>',
    ],
    ['\\sqrt{x}', '<mrow><msqrt><mrow><mi>x</mi></mrow></msqrt></mrow>'],
    [
      '\\sqrt[3]{x}',
      '<mrow><mroot><mrow><mi>x</mi></mrow><mrow><mn>3</mn></mrow></mroot></mrow>',
    ],
    [
      '\\left(a+b\\right)^2',
      '<mrow><msup><mrow><mo fence="true" form="prefix">(</mo><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo fence="true" form="postfix">)</mo></mrow><mrow><mn>2</mn></mrow></msup></mrow>',
    ],
    [
      '\\sum_{i=1}^{n}i',
      '<mrow><msubsup><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mrow><mi>n</mi></mrow></msubsup><mi>i</mi></mrow>',
    ],
    [
      'x_1^2',
      '<mrow><msubsup><mi>x</mi><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></msubsup></mrow>',
    ],
    ['\\sin x', '<mrow><mi>sin</mi><mi>x</mi></mrow>'],
    [
      '\\hat{x}',
      '<mrow><mover accent="true"><mrow><mi>x</mi></mrow><mo>^</mo></mover></mrow>',
    ],
    [
      '\\vec{v}',
      '<mrow><mover accent="true"><mrow><mi>v</mi></mrow><mo>→</mo></mover></mrow>',
    ],
    [
      '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}',
      '<mrow><mrow><mo fence="true" form="prefix">(</mo><mtable>' +
        '<mtr><mtd><mrow><mn>1</mn></mrow></mtd><mtd><mrow><mn>2</mn></mrow></mtd></mtr>' +
        '<mtr><mtd><mrow><mn>3</mn></mrow></mtd><mtd><mrow><mn>4</mn></mrow></mtd></mtr>' +
        '</mtable><mo fence="true" form="postfix">)</mo></mrow></mrow>',
    ],
    // Incomplete input still gives MathML; a semantic parse would fail here.
    ['\\frac{}{}', '<mrow><mfrac><mrow></mrow><mrow></mrow></mfrac></mrow>'],
    ['', '<mrow></mrow>'],
  ])('%s', (tex, expected) => {
    expect(mathml(parseTex(tex))).toEqual(expected);
  });

  test('a named operator typed letter by letter is one <mi>', () => {
    expect(mathml(row([...chars('sin'), char('x')]))).toEqual(
      '<mrow><mi>sin</mi><mi>x</mi></mrow>',
    );
  });

  test('a decimal point not followed by a digit is an operator', () => {
    expect(mathml(row(chars('3.')))).toEqual(
      '<mrow><mn>3</mn><mo>.</mo></mrow>',
    );
  });

  test('a limits node is an <munder> or <munderover>', () => {
    expect(
      mathml(
        row([
          limits(row(chars('lim')), [char('x'), char('→'), char('0')]),
          char('f'),
        ]),
      ),
    ).toEqual(
      '<mrow><munder><mrow><mi>lim</mi></mrow><mrow><mi>x</mi><mo>→</mo><mn>0</mn></mrow></munder><mi>f</mi></mrow>',
    );
    expect(
      mathml(row([limits(char('∑'), [char('i')], [char('n')]), char('i')])),
    ).toEqual(
      '<mrow><munderover><mo>∑</mo><mrow><mi>i</mi></mrow><mrow><mi>n</mi></mrow></munderover><mi>i</mi></mrow>',
    );
  });

  test('a subsup at the start of a row has an empty base', () => {
    expect(mathml(row([subsup(undefined, [char('2')])]))).toEqual(
      '<mrow><msup><mrow></mrow><mrow><mn>2</mn></mrow></msup></mrow>',
    );
  });

  test('a macro being typed is shown with its backslash', () => {
    expect(mathml(row([macro(chars('sq'))]))).toEqual(
      '<mrow><mrow><mo>\\</mo><mrow><mi>s</mi><mi>q</mi></mrow></mrow></mrow>',
    );
  });

  test('cancelled nodes are wrapped in a crossed-out <menclose>', () => {
    const cancel = (node: Editor.types.CharAtom): Editor.types.CharAtom => ({
      ...node,
      style: { cancel: 1 },
    });
    expect(
      mathml(row([cancel(char('2')), cancel(char('x')), char('+'), char('1')])),
    ).toEqual(
      '<mrow><menclose notation="updiagonalstrike"><mn>2</mn><mi>x</mi></menclose><mo>+</mo><mn>1</mn></mrow>',
    );
  });

  test('sets display on <math>', () => {
    const markup = (display: 'block' | 'inline'): string =>
      ReactDOMServer.renderToStaticMarkup(
        <HiddenMathml row={parseTex('x')} display={display} />,
      );
    expect(markup('block')).toContain('display="block"');
    expect(markup('inline')).toContain('display="inline"');
  });
});
