import { parse, newPrint as print } from '../../../test-util';

import { simplifyMul } from '../simplify-mul';

describe('simplify multiplication', () => {
  test.each`
    input             | output
    ${'(-a)(b)(c)'}   | ${'-abc'}
    ${'(a)(b)(-c)'}   | ${'-abc'}
    ${'(-a)(-b)(c)'}  | ${'abc'}
    ${'(-a)(-b)(-c)'} | ${'-abc'}
    ${'(-a)(bc)'}     | ${'-(a)(bc)'}
  `('isNegative($input) -> $output', ({ input, output }) => {
    const result = simplifyMul(parse(input), []);

    if (!result) {
      throw new Error('no result');
    }

    expect(print(result.after)).toEqual(output);
  });
});
