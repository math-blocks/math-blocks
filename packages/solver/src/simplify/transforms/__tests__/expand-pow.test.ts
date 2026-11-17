import * as Semantic from '@math-blocks/semantic';

import { parse, print } from '../../../test-util';

import { expandPow } from '../expand-pow';

describe('expandPow', () => {
  test.each`
    input          | output
    ${'(x + 1)^2'} | ${'(x+1)x+(x+1)'}
    ${'(x - 3)^2'} | ${'(x-3)x-3(x-3)'}
    ${'(a + b)^2'} | ${'(a+b)a+(a+b)b'}
  `('expandPow($input) -> $output', ({ input, output }) => {
    const result = expandPow(parse(input), []);

    if (!result) {
      throw new Error('no result');
    }

    expect(result.message).toEqual('expand power');
    expect(result.substeps.map((substep) => substep.message)).toEqual([
      'a power is repeated multiplication',
      'distribute',
    ]);
    expect(print(result.substeps[0].after)).toEqual(
      print(parse(input.replace('^2', '').repeat(2))),
    );
    expect(print(result.after)).toEqual(output);
  });

  test.each`
    input          | reason
    ${'x + 1'}     | ${'not a power'}
    ${'x^2'}       | ${'the base is not a sum'}
    ${'(x + 1)^3'} | ${'the exponent is not 2'}
    ${'(x + 1)^n'} | ${'the exponent is not a number'}
  `('expandPow($input) does nothing because $reason', ({ input }) => {
    expect(expandPow(parse(input), [])).toBeUndefined();
  });

  test('does nothing inside a fraction', () => {
    const div = parse('\\frac{1}{(x + 1)^2}') as Semantic.types.Div;
    expect(expandPow(div.args[1], [div])).toBeUndefined();
  });
});
