import { parse, print } from '../../../test-util';

import { reduceFraction } from '../reduce-fraction';

describe('reduce fraction', () => {
  test.each`
    input           | output
    ${'xyz / xy'}   | ${'z'}
    ${'-xyz / xy'}  | ${'-z'}
    ${'-xyz / -xy'} | ${'z'}
    ${'xyz / -xy'}  | ${'-z'}
    ${'xy / xyz'}   | ${'\\frac{1}{z}'}
    ${'-xy / xyz'}  | ${'-\\frac{1}{z}'}
    ${'-xy / -xyz'} | ${'\\frac{1}{z}'}
    ${'xy / -xyz'}  | ${'-\\frac{1}{z}'}
    ${'6x / 2'}     | ${'3x'}
    ${'6x / -2'}    | ${'-3x'}
    ${'-6x / 2'}    | ${'-3x'}
    ${'-6x / -2'}   | ${'3x'}
    ${'2x / 6'}     | ${'\\frac{x}{3}'}
    ${'10x / 6'}    | ${'\\frac{5x}{3}'}
  `('isNegative($input) -> $output', ({ input, output }) => {
    const result = reduceFraction(parse(input))!;
    expect(print(result.after)).toEqual(output);
  });
});
