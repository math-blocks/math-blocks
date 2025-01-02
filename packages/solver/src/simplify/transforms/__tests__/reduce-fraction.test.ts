import { parse, print } from '../../../test-util';

import { reduceFraction } from '../reduce-fraction';

describe('reduce fraction', () => {
  test.each`
    input                  | output
    ${'\\frac{xyz}{xy}'}   | ${'z'}
    ${'\\frac{-xyz}{xy}'}  | ${'-z'}
    ${'\\frac{-xyz}{-xy}'} | ${'z'}
    ${'\\frac{xyz}{-xy}'}  | ${'-z'}
    ${'\\frac{xy}{xyz}'}   | ${'\\frac{1}{z}'}
    ${'\\frac{-xy}{xyz}'}  | ${'-\\frac{1}{z}'}
    ${'\\frac{-xy}{-xyz}'} | ${'\\frac{1}{z}'}
    ${'\\frac{xy}{-xyz}'}  | ${'-\\frac{1}{z}'}
    ${'\\frac{6x}{2}'}     | ${'3x'}
    ${'\\frac{6x}{-2}'}    | ${'-3x'}
    ${'\\frac{-6x}{2}'}    | ${'-3x'}
    ${'\\frac{-6x}{-2}'}   | ${'3x'}
    ${'\\frac{2x}{6}'}     | ${'\\frac{x}{3}'}
    ${'\\frac{10x}{6}'}    | ${'\\frac{5x}{3}'}
  `('isNegative($input) -> $output', ({ input, output }) => {
    const result = reduceFraction(parse(input))!;
    expect(print(result.after)).toEqual(output);
  });
});
