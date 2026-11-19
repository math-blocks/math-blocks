import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';

import { parse as texParse } from '../parser';

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

const expectParse = (tex: string, expected: Semantic.types.Node): void => {
  expect(strip(parse(tex))).toEqual(strip(expected));
};

const a = b.identifier('a');
const x = b.identifier('x');

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
});
