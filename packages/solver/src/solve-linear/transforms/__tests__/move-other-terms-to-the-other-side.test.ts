import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { moveOtherTermsToOneSide } from '../move-other-terms-to-the-other-side';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

describe('move other terms to the other side', () => {
  test.each`
    input                    | output           | substeps
    ${'y = z'}               | ${'y = z'}       | ${0}
    ${'x = x + 1'}           | ${'x = x + 1'}   | ${0}
    ${'2x = 5'}              | ${'2x = 5'}      | ${0}
    ${'5 = 2x'}              | ${'5 = 2x'}      | ${0}
    ${'2x + 5 = 10'}         | ${'2x = 5'}      | ${2}
    ${'10 = 2x + 5'}         | ${'5 = 2x'}      | ${2}
    ${'2x - y + 5 = 10'}     | ${'2x = 5 + y'}  | ${4}
    ${'2x - y + 5 = 10 + y'} | ${'2x = 5 + 2y'} | ${4}
    ${'10 + y = 2x - y + 5'} | ${'5 + 2y = 2x'} | ${4}
  `(
    'moveVariableToOneSide($input) -> $output',
    ({ input, output, substeps }) => {
      const ident = Semantic.builders.identifier('x');
      const result = moveOtherTermsToOneSide(parseNumRel(input), ident)!;
      if (result === undefined) {
        expect(input).toEqual(output);
      } else {
        expect(Testing.print(result.after)).toEqual(output);
        expect(result.substeps.length).toEqual(substeps);
      }
    },
  );
});
