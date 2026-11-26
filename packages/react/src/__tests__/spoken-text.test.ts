// getSpokenText() describes math in words for screen readers. MathRenderer
// uses it as the SVG's aria-label. See
// https://github.com/math-blocks/math-blocks/issues/86.
import * as Editor from '@math-blocks/editor';
import { parse } from '@math-blocks/tex';

import { getSpokenText } from '../spoken-text';

const { builders, AccentType } = Editor;
const { char, row } = builders;

const chars = (text: string): Editor.types.CharAtom[] =>
  [...text].map((c) => char(c));

describe('getSpokenText', () => {
  test.each([
    // Operators and numbers
    ['1+2=3', '1 plus 2 equals 3'],
    ['12.5x-3', '12.5 x minus 3'],
    ['a\\cdot b', 'a times b'],
    ['a\\neq b', 'a is not equal to b'],
    ['\\alpha\\le\\beta', 'alpha is less than or equal to beta'],
    ['x\\in\\R', 'x is an element of the real numbers'],
    // Exponents and subscripts
    ['x^2+1', 'x squared plus 1'],
    ['x^3', 'x cubed'],
    ['x^n', 'x to the power of n'],
    ['e^{-x}', 'e to the power of minus x, end power'],
    ['x_1', 'x sub 1'],
    ['x_{i+1}^2', 'x sub i plus 1, end sub squared'],
    // Fractions
    ['\\frac{1}{2}', '1 over 2'],
    ['\\frac{x+1}{2}', 'the fraction x plus 1 over 2, end fraction'],
    ['\\frac{\\frac{1}{2}}{3}', 'the fraction 1 over 2 over 3, end fraction'],
    // Roots
    ['\\sqrt{2}', 'the square root of 2'],
    ['\\sqrt{x+1}', 'the square root of x plus 1, end root'],
    ['\\sqrt[3]{x}', 'the cube root of x'],
    ['\\sqrt[n]{x}', 'the root with index n of x'],
    // Delimiters
    ['\\left(a+b\\right)^2', 'open paren a plus b close paren squared'],
    ['(a+b)', 'open paren a plus b close paren'],
    ['\\left|x\\right|', 'the absolute value of x, end absolute value'],
    // Large operators read their scripts as bounds
    ['\\sum_{i=1}^{n}i', 'sum from i equals 1 to n of i'],
    ['\\int_0^1 x', 'integral from 0 to 1 of x'],
    ['\\lim_{x\\rightarrow0}f', 'limit as x approaches 0 of f'],
    ['x\\rightarrow0', 'x right arrow 0'],
    // Named operators and accents
    ['\\sin x', 'sin x'],
    ['\\ln x', 'natural log x'],
    ['\\vec{v}', 'vector v'],
    ['\\hat{x}', 'x hat'],
    // Matrices
    [
      '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}',
      'matrix with 2 rows and 2 columns, row 1: a, b; row 2: c, d, end matrix',
    ],
    // The quadratic formula
    [
      'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
      'x equals the fraction minus b plus or minus the square root of b squared minus 4 a c, end root over 2 a, end fraction',
    ],
  ])('%s', (tex, expected) => {
    expect(getSpokenText(parse(tex))).toBe(expected);
  });

  test('an empty row is read as blank', () => {
    expect(getSpokenText(row([]))).toBe('blank');
  });

  test('empty parts of a node are read as blank', () => {
    expect(getSpokenText(row([builders.frac([], [])]))).toBe(
      'the fraction blank over blank, end fraction',
    );
  });

  test('a limits node reads its bounds', () => {
    const sum = builders.limits(char('∑'), chars('i=0'), chars('n'));
    expect(getSpokenText(row([sum, char('i')]))).toBe(
      'sum from i equals 0 to n of i',
    );
    const lim = builders.limits(char('lim'), [char('x'), char('→'), char('∞')]);
    expect(getSpokenText(row([lim]))).toBe('limit as x approaches infinity');
    const max = builders.limits(char('max'), chars('x'));
    expect(getSpokenText(row([max]))).toBe('maximum over x');
  });

  test('a subscript without a superscript on a large operator', () => {
    expect(getSpokenText(parse('\\sum_{i}i'))).toBe('sum over i of i');
  });

  test('accents', () => {
    const accents: readonly (readonly [Editor.AccentType, string])[] = [
      [AccentType.Bar, 'x bar'],
      [AccentType.Dot, 'x dot'],
      [AccentType.DDot, 'x double dot'],
      [AccentType.Tilde, 'x tilde'],
    ];
    for (const [accent, expected] of accents) {
      expect(getSpokenText(row([builders.accent(chars('x'), accent)]))).toBe(
        expected,
      );
    }
  });

  test('unmatched delimiters are read one at a time', () => {
    const node = builders.delimited(chars('x'), char('|'), char(')'));
    expect(getSpokenText(row([node]))).toBe('vertical bar x close paren');
  });

  test('a macro being typed is read with its backslash', () => {
    expect(getSpokenText(row([builders.macro(chars('sq'))]))).toBe(
      'backslash s q',
    );
  });

  test('a table with an empty cell', () => {
    const table = builders.table([row(chars('1')), null], 2, 1);
    expect(getSpokenText(row([table]))).toBe(
      'matrix with 1 row and 2 columns, row 1: 1, blank, end matrix',
    );
  });

  test('characters without a name are read as themselves', () => {
    expect(getSpokenText(row(chars('xy')))).toBe('x y');
  });
});
