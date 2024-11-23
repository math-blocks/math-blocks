import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { simplifyMul } from '../simplify-mul';

const parse = (str: string): Semantic.types.Node =>
  Testing.parse(str) as Semantic.types.Node;

describe('simplify multiplication', () => {
  test.each`
    input             | output
    ${'(-a)(b)(c)'}   | ${'-abc'}
    ${'(a)(b)(-c)'}   | ${'-abc'}
    ${'(-a)(-b)(c)'}  | ${'abc'}
    ${'(-a)(-b)(-c)'} | ${'-abc'}
  `('isNegative($input) -> $output', ({ input, output }) => {
    const result = simplifyMul(parse(input), []);

    if (!result) {
      throw new Error('no result');
    }

    expect(Testing.print(result.after)).toEqual(output);
  });
});
