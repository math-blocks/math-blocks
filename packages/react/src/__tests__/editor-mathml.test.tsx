// The Presentation MathML that MathRenderer renders, visually hidden, for
// screen readers. See https://github.com/math-blocks/math-blocks/issues/86.
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import * as Editor from '@math-blocks/editor';
import { parse as parseTex } from '@math-blocks/tex';

import { HiddenMathml } from '../editor-mathml';

const { char, row, subsup, limits, macro, delimited, matrix } = Editor.builders;

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
    ['x^2+1', '<msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>1</mn>'],
    ['12.5+3', '<mn>12.5</mn><mo>+</mo><mn>3</mn>'],
    [
      '\\frac{x+1}{2}',
      '<mfrac><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mn>2</mn></mfrac>',
    ],
    ['\\sqrt{x}', '<msqrt><mi>x</mi></msqrt>'],
    // <msqrt> wraps its children in an implied <mrow>.
    ['\\sqrt{x+1}', '<msqrt><mi>x</mi><mo>+</mo><mn>1</mn></msqrt>'],
    ['\\sqrt[3]{x}', '<mroot><mi>x</mi><mn>3</mn></mroot>'],
    [
      '\\left(a+b\\right)^2',
      '<msup><mrow><mo fence="true" form="prefix">(</mo><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo fence="true" form="postfix">)</mo></mrow><mn>2</mn></msup>',
    ],
    [
      '\\sum_{i=1}^{n}i',
      '<msubsup><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></msubsup><mi>i</mi>',
    ],
    ['x_1^2', '<msubsup><mi>x</mi><mn>1</mn><mn>2</mn></msubsup>'],
    ['\\sin x', '<mi>sin</mi><mi>x</mi>'],
    ['\\hat{x}', '<mover accent="true"><mi>x</mi><mo>^</mo></mover>'],
    ['\\vec{v}', '<mover accent="true"><mi>v</mi><mo>→</mo></mover>'],
    [
      '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}',
      '<mrow><mo fence="true" form="prefix">(</mo><mtable>' +
        '<mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>' +
        '<mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>' +
        '</mtable><mo fence="true" form="postfix">)</mo></mrow>',
    ],
    // Incomplete input still gives MathML; a semantic parse would fail here.
    ['\\frac{}{}', '<mfrac><mrow></mrow><mrow></mrow></mfrac>'],
    ['', ''],
  ])('%s', (tex, expected) => {
    expect(mathml(parseTex(tex))).toEqual(expected);
  });

  test('a named operator typed letter by letter is one <mi>', () => {
    expect(mathml(row([...chars('sin'), char('x')]))).toEqual(
      '<mi>sin</mi><mi>x</mi>',
    );
  });

  test('a decimal point not followed by a digit is an operator', () => {
    expect(mathml(row(chars('3.')))).toEqual('<mn>3</mn><mo>.</mo>');
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
      '<munder><mi>lim</mi><mrow><mi>x</mi><mo>→</mo><mn>0</mn></mrow></munder><mi>f</mi>',
    );
    expect(
      mathml(row([limits(char('∑'), [char('i')], [char('n')]), char('i')])),
    ).toEqual(
      '<munderover><mo>∑</mo><mi>i</mi><mi>n</mi></munderover><mi>i</mi>',
    );
  });

  test('a subsup at the start of a row has an empty base', () => {
    expect(mathml(row([subsup(undefined, [char('2')])]))).toEqual(
      '<msup><mrow></mrow><mn>2</mn></msup>',
    );
  });

  test('a macro being typed is shown with its backslash', () => {
    expect(mathml(row([macro(chars('sq'))]))).toEqual(
      '<mrow><mo>\\</mo><mi>s</mi><mi>q</mi></mrow>',
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
      '<menclose notation="updiagonalstrike"><mn>2</mn><mi>x</mi></menclose><mo>+</mo><mn>1</mn>',
    );
  });

  test("doesn't wrap a single element in an <mrow>", () => {
    // An <mrow> with one child means the same as the child.
    expect(mathml(parseTex('\\frac{1}{2}'))).toEqual(
      '<mfrac><mn>1</mn><mn>2</mn></mfrac>',
    );
  });

  test('delimiters around one element group them without another <mrow>', () => {
    expect(mathml(parseTex('\\left(x\\right)'))).toEqual(
      '<mrow><mo fence="true" form="prefix">(</mo><mi>x</mi><mo fence="true" form="postfix">)</mo></mrow>',
    );
  });

  test('empty delimiters have no empty <mrow> between them', () => {
    expect(mathml(parseTex('\\left(\\right)'))).toEqual(
      '<mrow><mo fence="true" form="prefix">(</mo><mo fence="true" form="postfix">)</mo></mrow>',
    );
  });

  test('a missing delimiter is left out', () => {
    expect(mathml(row([delimited(chars('x+1'), char('('), char(''))]))).toEqual(
      '<mrow><mo fence="true" form="prefix">(</mo><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></mrow>',
    );
    // With neither delimiter, the contents need no <mrow> of their own.
    expect(mathml(row([delimited([char('x')], char(''), char(''))]))).toEqual(
      '<mi>x</mi>',
    );
  });

  test('a matrix with empty delimiters is just the <mtable>', () => {
    expect(
      mathml(
        row([
          matrix([row([char('1')]), row([char('2')])], 2, 1, {
            left: char(''),
            right: char(''),
          }),
        ]),
      ),
    ).toEqual(
      '<mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr></mtable>',
    );
  });

  describe('crossed-out (\\cancel) nodes', () => {
    const crossed = <T extends Editor.types.CharNode>(node: T): T => ({
      ...node,
      style: { cancel: 1 },
    });
    const STRIKE = '<menclose notation="updiagonalstrike">';

    test('a crossed-out script keeps its base', () => {
      expect(
        mathml(
          row([char('x'), crossed(subsup(undefined, [char('2')])), char('+')]),
        ),
      ).toEqual(
        `<msup><mi>x</mi>${STRIKE}<mn>2</mn></menclose></msup><mo>+</mo>`,
      );
    });

    test('a crossed-out base keeps its script', () => {
      expect(
        mathml(row([crossed(char('x')), subsup(undefined, [char('2')])])),
      ).toEqual(`<msup>${STRIKE}<mi>x</mi></menclose><mn>2</mn></msup>`);
    });

    test('each crossed-out script of a subsup is crossed out', () => {
      expect(
        mathml(row([char('x'), crossed(subsup([char('i')], [char('2')]))])),
      ).toEqual(
        `<msubsup><mi>x</mi>${STRIKE}<mi>i</mi></menclose>${STRIKE}<mn>2</mn></menclose></msubsup>`,
      );
    });

    test('a base and script crossed out together are one <menclose>', () => {
      expect(
        mathml(
          row([crossed(char('x')), crossed(subsup(undefined, [char('2')]))]),
        ),
      ).toEqual(`${STRIKE}<msup><mi>x</mi><mn>2</mn></msup></menclose>`);
    });

    test('digits and named operators split where crossing out changes', () => {
      expect(
        mathml(row([char('1'), crossed(char('2')), crossed(char('3'))])),
      ).toEqual(`<mn>1</mn>${STRIKE}<mn>23</mn></menclose>`);
      expect(mathml(row([char('s'), crossed(char('i')), char('n')]))).toEqual(
        `<mi>s</mi>${STRIKE}<mi>i</mi></menclose><mi>n</mi>`,
      );
    });
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
