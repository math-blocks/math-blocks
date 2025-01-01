import * as Semantic from '@math-blocks/semantic';

import * as Testing from '../../../test-util';

import { reduceFraction } from '../reduce-fraction';

const parse = (str: string): Semantic.types.Node =>
  Testing.parse(str) as Semantic.types.Node;

describe('reduce fraction', () => {
  test.each`
    input           | output
    ${'xyz / xy'}   | ${'z'}
    ${'-xyz / xy'}  | ${'-z'}
    ${'-xyz / -xy'} | ${'z'}
    ${'xyz / -xy'}  | ${'-z'}
    ${'xy / xyz'}   | ${'1 / z'}
    ${'-xy / xyz'}  | ${'-(1 / z)'}
    ${'-xy / -xyz'} | ${'1 / z'}
    ${'xy / -xyz'}  | ${'-(1 / z)'}
    ${'6x / 2'}     | ${'3x'}
    ${'6x / -2'}    | ${'-3x'}
    ${'-6x / 2'}    | ${'-3x'}
    ${'-6x / -2'}   | ${'3x'}
    ${'2x / 6'}     | ${'x / 3'}
    ${'10x / 6'}    | ${'5x / 3'}
  `('isNegative($input) -> $output', ({ input, output }) => {
    const result = reduceFraction(parse(input))!;
    expect(Testing.print(result.after)).toEqual(output);
  });
});
