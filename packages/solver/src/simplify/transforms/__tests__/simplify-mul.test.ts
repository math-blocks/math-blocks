import { parse, print } from '../../../test-util';

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

  // `mulByZeroIsZero` handles these, so that `0 * -1` becomes 0, not -0.
  test.each(['(0)(-1)', '(-1)(0)', '(0)(-a)'])(
    'leaves %s with a zero factor alone',
    (input) => {
      expect(simplifyMul(parse(input), [])).toBeUndefined();
    },
  );
});
