import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';

import { parse as texParse } from '../parser';
import { print as texPrint } from '../printer';

const { builders: b } = Semantic;

// Parses TeX all the way to a semantic tree: TeX -> editor tree -> semantic tree.
const parse = (tex: string): Semantic.types.Node => Editor.parse(texParse(tex));

// Removes `id` and `loc` so that trees built by the parser and by builders
// can be compared with `toEqual`, which gives a readable diff on failure.
const strip = (node: Semantic.types.Node): unknown =>
  JSON.parse(
    JSON.stringify(node, (key, value) =>
      key === 'id' || key === 'loc' ? undefined : value,
    ),
  );

// Prints a semantic tree as TeX: semantic tree -> editor tree -> TeX.
const print = (node: Semantic.types.Node): string =>
  texPrint(Editor.print(node));

const expectParse = (tex: string, expected: Semantic.types.Node): void => {
  expect(strip(parse(tex))).toEqual(strip(expected));
};

const a = b.identifier('a');
const x = b.identifier('x');
const y = b.identifier('y');
const z = b.identifier('z');
const num = (value: string): Semantic.types.Node => b.number(value);

describe('Editor.parse(Tex.parse(...))', () => {
  describe('subtraction and negation', () => {
    test('a-b', () => {
      expectParse('a-b', b.add([a, b.neg(b.identifier('b'), true)]));
    });

    test('a−b (minus sign)', () => {
      expectParse('a−b', b.add([a, b.neg(b.identifier('b'), true)]));
    });

    test('2x+5-5=10-5', () => {
      expectParse(
        '2x+5-5=10-5',
        b.eq([
          b.add([
            b.mul([b.number('2'), x], true),
            b.number('5'),
            b.neg(b.number('5'), true),
          ]),
          b.add([b.number('10'), b.neg(b.number('5'), true)]),
        ]),
      );
    });

    test('-3x+4=-2', () => {
      expectParse(
        '-3x+4=-2',
        b.eq([
          b.add([b.neg(b.mul([b.number('3'), x], true)), b.number('4')]),
          b.neg(b.number('2')),
        ]),
      );
    });

    test('a--b', () => {
      expectParse('a--b', b.add([a, b.neg(b.neg(b.identifier('b')), true)]));
    });

    test('\\frac{x-1}{2}', () => {
      expectParse(
        '\\frac{x-1}{2}',
        b.div(b.add([x, b.neg(b.number('1'), true)]), b.number('2')),
      );
    });
  });

  describe('unrecognized chars', () => {
    test('throws instead of dropping them', () => {
      expect(() => parse('a?b')).toThrow("Unexpected character '?'");
    });
  });

  // https://github.com/math-blocks/math-blocks/issues/730
  describe('TeX from math input fields', () => {
    describe('\\div', () => {
      test('x\\div2=3', () => {
        expectParse('x\\div2=3', b.eq([b.div(x, num('2')), num('3')]));
      });

      test('is left associative', () => {
        expectParse('a\\div x\\div y', b.div(b.div(a, x), y));
      });

      test('has the same precedence as \\times', () => {
        expectParse('a\\times x\\div y', b.div(b.mul([a, x], false), y));
        expectParse('a\\div x\\times y', b.mul([b.div(a, x), y], false));
      });

      test('binds less tightly than implicit multiplication', () => {
        expectParse('6\\div 2x', b.div(num('6'), b.mul([num('2'), x], true)));
      });

      test('binds more tightly than addition', () => {
        expectParse('1+x\\div2', b.add([num('1'), b.div(x, num('2'))]));
      });
    });

    describe('\\ne', () => {
      test('x\\ne 5', () => {
        expectParse('x\\ne 5', b.neq([x, num('5')]));
      });

      test('x\\neq 5', () => {
        expectParse('x\\neq 5', b.neq([x, num('5')]));
      });
    });

    describe('\\pi', () => {
      test('2\\pi r', () => {
        expectParse(
          '2\\pi r',
          b.mul([num('2'), b.pi(), b.identifier('r')], true),
        );
      });

      test('\\pi alone', () => {
        expectParse('\\pi', b.pi());
      });
    });

    describe('other greek letters are identifiers', () => {
      test('2\\theta', () => {
        expectParse('2\\theta', b.mul([num('2'), b.identifier('θ')], true));
      });
    });

    describe('named functions', () => {
      test('\\log x', () => {
        expectParse('\\log x', b.log(num('10'), x));
      });

      test('\\log_2 x', () => {
        expectParse('\\log_2 x', b.log(num('2'), x));
      });

      test('\\ln x', () => {
        expectParse('\\ln x', b.ln(x));
      });

      test('\\sin x', () => {
        expectParse('\\sin x', b.sin(x));
      });

      test('\\cos x, \\tan x, \\cot x, \\sec x, \\csc x', () => {
        expectParse('\\cos x', b.cos(x));
        expectParse('\\tan x', b.tan(x));
        expectParse('\\cot x', b.cot(x));
        expectParse('\\sec x', b.sec(x));
        expectParse('\\csc x', b.csc(x));
      });

      test('\\arcsin x', () => {
        expectParse('\\arcsin x', b.arcsin(x));
      });

      test('\\sin(x)', () => {
        expectParse('\\sin(x)', b.sin(x));
        expectParse('\\sin\\left(x\\right)', b.sin(x));
      });

      test('\\sin 2x applies sin to 2x', () => {
        expectParse('\\sin 2x', b.sin(b.mul([num('2'), x], true)));
      });

      test('\\sin x^2 applies sin to x^2', () => {
        expectParse('\\sin x^2', b.sin(b.pow(x, num('2'))));
      });

      test('\\sin x + 1', () => {
        expectParse('\\sin x + 1', b.add([b.sin(x), num('1')]));
      });

      test('\\sin x \\cos x', () => {
        expectParse('\\sin x \\cos x', b.mul([b.sin(x), b.cos(x)], true));
      });

      test('2x\\sin x', () => {
        expectParse('2x\\sin x', b.mul([num('2'), x, b.sin(x)], true));
      });

      // A leading minus negates the whole implicit product, like `-xy` is
      // `-(xy)`, rather than splitting it before the function.
      test('-x\\sin x negates x sin(x)', () => {
        expectParse('-xy', b.neg(b.mul([x, y], true)));
        expectParse('-x\\sin x', b.neg(b.mul([x, b.sin(x)], true)));
      });

      test('-2x\\sin x negates 2x sin(x)', () => {
        expectParse('-2x\\sin x', b.neg(b.mul([num('2'), x, b.sin(x)], true)));
      });

      test('-\\sin x \\cos x negates sin(x) cos(x)', () => {
        expectParse('-\\sin x', b.neg(b.sin(x)));
        expectParse(
          '-\\sin x \\cos x',
          b.neg(b.mul([b.sin(x), b.cos(x)], true)),
        );
      });

      test('2-x\\sin x', () => {
        expectParse(
          '2-x\\sin x',
          b.add([num('2'), b.neg(b.mul([x, b.sin(x)], true), true)]),
        );
      });

      test('\\sin^2 x', () => {
        expectParse('\\sin^2 x', b.pow(b.sin(x), num('2')));
      });

      test('2\\sin x=1', () => {
        expectParse(
          '2\\sin x=1',
          b.eq([b.mul([num('2'), b.sin(x)], true), num('1')]),
        );
      });

      test('a function with no argument throws', () => {
        expect(() => parse('\\sin')).toThrow('Missing argument for sin');
        expect(() => parse('\\sin+1')).toThrow('Missing argument for sin');
      });

      test('an unsupported function throws', () => {
        expect(() => parse('\\max x')).toThrow("Unsupported function 'max'");
      });

      test('a subscript on a function other than log throws', () => {
        expect(() => parse('\\sin_2 x')).toThrow(
          'Only log can have a subscript, not sin',
        );
      });
    });

    describe('inverse trig functions', () => {
      test('\\sin^{-1} x', () => {
        expectParse('\\sin^{-1} x', b.arcsin(x));
      });

      test('\\cos^{-1}x and \\tan^-1 x', () => {
        expectParse('\\cos^{-1}x', b.arccos(x));
        expectParse('\\tan^-1 x', b.arctan(x));
      });
    });

    describe('bare parentheses', () => {
      test('(a)', () => {
        expectParse('(a)', b.parens(a));
      });

      test('2*(x-1)', () => {
        expectParse(
          '2*(x-1)',
          b.mul([num('2'), b.add([x, b.neg(num('1'), true)])], false),
        );
      });

      test('2(x+1)', () => {
        expectParse('2(x+1)', b.mul([num('2'), b.add([x, num('1')])], true));
      });

      test('nested parens', () => {
        expectParse(
          '((x+1)(x-1))',
          b.parens(
            b.mul(
              [b.add([x, num('1')]), b.add([x, b.neg(num('1'), true)])],
              true,
            ),
          ),
        );
      });

      test('an unmatched paren throws', () => {
        expect(() => parse('(x+1')).toThrow();
        expect(() => parse('x+1)')).toThrow();
      });
    });

    describe('empty input', () => {
      test('throws a clear error', () => {
        expect(() => parse('')).toThrow('Empty input');
        expect(() => parse('   ')).toThrow('Empty input');
      });
    });

    describe('negative exponents without braces', () => {
      test('x^-2', () => {
        expectParse('x^-2', b.pow(x, b.neg(num('2'))));
      });

      test('x^{-2}', () => {
        expectParse('x^{-2}', b.pow(x, b.neg(num('2'))));
      });
    });

    describe('exponents are right associative', () => {
      test('x^y^z', () => {
        expectParse('x^y^z', b.pow(x, b.pow(y, z)));
      });

      test('2^3^4^5', () => {
        expectParse(
          '2^3^4^5',
          b.pow(num('2'), b.pow(num('3'), b.pow(num('4'), num('5')))),
        );
      });

      test('x^{y^z}', () => {
        expectParse('x^{y^z}', b.pow(x, b.pow(y, z)));
      });
    });

    describe('chained equations', () => {
      test('2x=5=100 is a single Equals node with three args', () => {
        expectParse(
          '2x=5=100',
          b.eq([b.mul([num('2'), x], true), num('5'), num('100')]),
        );
      });
    });

    describe('absolute value', () => {
      test('|x|', () => {
        expectParse('|x|', b.abs(x));
      });

      test('\\left|x\\right|', () => {
        expectParse('\\left|x\\right|', b.abs(x));
      });

      test('|x-1|+2', () => {
        expectParse(
          '|x-1|+2',
          b.add([b.abs(b.add([x, b.neg(num('1'), true)])), num('2')]),
        );
      });

      test('2|x|', () => {
        expectParse('2|x|', b.mul([num('2'), b.abs(x)], true));
      });

      test('|a|-|x|', () => {
        expectParse('|a|-|x|', b.add([b.abs(a), b.neg(b.abs(x), true)]));
      });

      test('||x|-1|', () => {
        expectParse('||x|-1|', b.abs(b.add([b.abs(x), b.neg(num('1'), true)])));
      });

      test('an unmatched bar throws', () => {
        expect(() => parse('|x')).toThrow("Unexpected character '|'");
      });

      test('mismatched delimiters throw', () => {
        expect(() => parse('\\left(x\\right|')).toThrow(
          'Mismatched delimiters',
        );
      });
    });
  });

  // https://github.com/math-blocks/math-blocks/issues/731
  describe('round trips through the printers', () => {
    test.each([
      ['x>y', 'x\\gt y'],
      ['x<y', 'x\\lt y'],
      ['x\\le y', 'x\\leq y'],
      ['x\\ge y', 'x\\geq y'],
      ['x\\ne y', 'x\\neq y'],
      ['2\\pi r', '2\\pi r'],
      ['\\pi', '\\pi'],
      ['\\sqrt{x}', '\\sqrt{x}'],
      ['\\sqrt[3]{x}', '\\sqrt[3]{x}'],
      ['\\sqrt{x+1}+2', '\\sqrt{x+1}+2'],
      ['|x|', '\\left|x\\right|'],
      ['|x-1|+2', '\\left|x-1\\right|+2'],
      ['a-b', 'a-b'],
      ['x^-2', 'x^{-2}'],
    ])('%s prints as %s and re-parses to the same tree', (tex, expected) => {
      const node = parse(tex);
      const printed = print(node);
      expect(printed).toEqual(expected);
      expect(strip(parse(printed))).toEqual(strip(node));
    });
  });
});
