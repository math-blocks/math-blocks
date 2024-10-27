import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { moveMatchingVariableTermsToOneSide } from '../move-matching-variable-terms-to-one-side';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

describe('move constants from left to right', () => {
  test.each`
    input                            | output                      | substeps
    ${'2x + 5 = 10'}                 | ${'2x + 5 = 10'}            | ${0}
    ${'10 = 2x + 5'}                 | ${'10 = 2x + 5'}            | ${0}
    ${'2x + 5 = 10 - 3x'}            | ${'5x + 5 = 10'}            | ${2}
    ${'2x + 5 = 10 + 3x'}            | ${'-x + 5 = 10'}            | ${2}
    ${'2x + 5 = 10 - 3x + x'}        | ${'4x + 5 = 10'}            | ${4}
    ${'2x - x + 5 = 10 + 3x'}        | ${'-2x + 5 = 10'}           | ${2}
    ${'2x + 5y - 1 = -3y + 10 - 3x'} | ${'5x + 5y - 1 = -3y + 10'} | ${2}
  `(
    'moveVariableToOneSide($input) -> $output',
    ({ input, output, substeps }) => {
      const ident = Semantic.builders.identifier('x');
      const result = moveMatchingVariableTermsToOneSide(
        parseNumRel(input),
        ident,
      )!;
      if (result === undefined) {
        expect(input).toEqual(output);
      } else {
        expect(Testing.print(result.after)).toEqual(output);
        expect(result.substeps.length).toEqual(substeps);
      }
    },
  );
});
