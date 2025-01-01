import { parse, print } from '../../../test-util';

import { multiplyPowers } from '../multiply-powers';

describe('multiplyPowers', () => {
  test.each`
    input                      | output
    ${'x^2 * x^3'}             | ${'x^(2 + 3)'}
    ${'x^n * x^m'}             | ${'x^(n + m)'}
    ${'x * x^2 * x^3'}         | ${'x^(1 + 2 + 3)'}
    ${'x^-5 * x^4'}            | ${'x^(-5 + 4)'}
    ${'x^4 * x^-5'}            | ${'x^(4 + -5)'}
    ${'x^2 * x^3 * y'}         | ${'x^(2 + 3) * y'}
    ${'x^2 x^3 y'}             | ${'x^(2 + 3)y'}
    ${'x^2 * y^n * x^3 * y^m'} | ${'x^(2 + 3) * y^(n + m)'}
    ${'(x + 1)^2 * (1 + x)^3'} | ${'(x + 1)^(2 + 3)'}
  `('multiplyPowers($input) -> $output', ({ input, output }) => {
    const result = multiplyPowers(parse(input));

    if (!result) {
      throw new Error('no result');
    }

    expect(print(result.after)).toEqual(output);
  });
});
