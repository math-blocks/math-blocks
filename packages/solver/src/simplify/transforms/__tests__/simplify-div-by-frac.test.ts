import * as Semantic from '@math-blocks/semantic';

import * as Testing from '../../../test-util';

import { simplifyDivByFrac } from '../simplify-div-by-frac';

const parse = (str: string): Semantic.types.Node =>
  Testing.parse(str) as Semantic.types.Node;

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
  `('simplifyDivByFrac($input) -> $output', ({ input, output }) => {
    const result = simplifyDivByFrac(parse(input))!;
    expect(Testing.print(result.after)).toEqual(output);
  });
});
