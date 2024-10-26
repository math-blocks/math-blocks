import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { simplifyDivByFrac } from '../simplify-div-by-frac';

const parse = (str: string): Semantic.types.NumericNode =>
  Testing.parse(str) as Semantic.types.NumericNode;

describe('simplify division by fraction', () => {
  test.each`
    input              | output
    ${'(1/x)/(1/y)'}   | ${'(1 / x)(y / 1)'}
    ${'-(1/x)/-(1/y)'} | ${'(-(1 / x))(-(y / 1))'}
    ${'(1/x)/-(1/y)'}  | ${'(1 / x)(-(y / 1))'}
    ${'-(1/x)/(1/y)'}  | ${'(-(1 / x))(y / 1)'}
    ${'2/(1/y)'}       | ${'(2)(y / 1)'}
    ${'-2/(1/y)'}      | ${'(-2)(y / 1)'}
    ${'2/-(1/y)'}      | ${'(2)(-(y / 1))'}
    ${'-2/-(1/y)'}     | ${'(-2)(-(y / 1))'}
  `('isNegative($input) -> $output', ({ input, output }) => {
    const result = simplifyDivByFrac(parse(input))!;
    expect(Testing.print(result.after)).toEqual(output);
  });
});
