import { parse, print } from '../../../test-util';

import { simplifyDivByFrac } from '../simplify-div-by-frac';

describe('simplify division by fraction', () => {
  test.each`
    input              | output
    ${'(1/x)/(1/y)'}   | ${'(\\frac{1}{x})(\\frac{y}{1})'}
    ${'-(1/x)/-(1/y)'} | ${'(-\\frac{1}{x})(-\\frac{y}{1})'}
    ${'(1/x)/-(1/y)'}  | ${'(\\frac{1}{x})(-\\frac{y}{1})'}
    ${'-(1/x)/(1/y)'}  | ${'(-\\frac{1}{x})(\\frac{y}{1})'}
    ${'2/(1/y)'}       | ${'(2)(\\frac{y}{1})'}
    ${'-2/(1/y)'}      | ${'(-2)(\\frac{y}{1})'}
    ${'2/-(1/y)'}      | ${'(2)(-\\frac{y}{1})'}
    ${'-2/-(1/y)'}     | ${'(-2)(-\\frac{y}{1})'}
  `('simplifyDivByFrac($input) -> $output', ({ input, output }) => {
    const result = simplifyDivByFrac(parse(input))!;
    expect(print(result.after)).toEqual(output);
  });
});
