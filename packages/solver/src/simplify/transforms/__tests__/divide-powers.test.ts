import { parse, newPrint as print } from '../../../test-util';

import { dividePowers } from '../divide-powers';

describe('dividePowers', () => {
  // TODO: This test case requires us to use an option to move
  // factors from the denominator into the numerator which we
  // haven't implemented yet.
  //     ${'x^2 / (x^3 y)'}         | ${'x^(2 - 3)y^(-1)'}
  test.each`
    input                      | output
    ${'x^2 / x^3'}             | ${'x^{2-3}'}
    ${'x^2 / x^-3'}            | ${'x^{2--3}'}
    ${'(x^2 y^n) / (x^3 y^m)'} | ${'x^{2-3}y^{n-m}'}
    ${'(x x^2) / x^3'}         | ${'x^{1+2-3}'}
    ${'x^2 / (x x^3)'}         | ${'x^{2-1-3}'}
    ${'(x^2 x^n) / (x^3 x^m)'} | ${'x^{2+n-3-m}'}
    ${'(x + 1)^2 / (x + 1)^3'} | ${'(x+1)^{2-3}'}
    ${'(x + 1)^2 / (1 + x)^3'} | ${'(x+1)^{2-3}'}
    ${'(x^2 y) / x^3'}         | ${'x^{2-3}y'}
  `('dividePowers($input) -> $output', ({ input, output }) => {
    const result = dividePowers(parse(input));

    if (!result) {
      throw new Error('no result');
    }

    expect(print(result.after)).toEqual(output);
  });
});
