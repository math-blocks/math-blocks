import { builders, types } from '@math-blocks/semantic';

import { parse, print } from '../../../test-util';
import type { Step } from '../../../types';

import { divBothSides } from '../div-both-sides';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

const transform = (node: types.NumericRelation): Step => {
  const ident = builders.identifier('x');
  const result = divBothSides(node, ident);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('divBothSides', () => {
  it('should divide both sides (variable on left)', () => {
    const before = parseNumRel('2x = 5');
    const step = transform(before);

    if (step.message !== 'do the same operation to both sides') {
      throw new Error(
        "expected step.message to be 'do the same operation to both sides'",
      );
    }
    expect(step.operation).toEqual('div');
    expect(print(step.value)).toEqual('2');
  });

  it('should divide both sides (variable on right)', () => {
    const before = parseNumRel('5 = 2x');
    const step = transform(before);

    if (step.message !== 'do the same operation to both sides') {
      throw new Error(
        "expected step.message to be 'do the same operation to both sides'",
      );
    }
    expect(step.operation).toEqual('div');
    expect(print(step.value)).toEqual('2');
  });

  it('should divide all terms (right)', () => {
    const before = parseNumRel('2x = a + b');
    const step = transform(before);

    expect(print(step.after)).toEqual('2x / 2 = (a + b) / 2');
  });

  it('should divide all terms (left)', () => {
    const before = parseNumRel('a + b = 2x');
    const step = transform(before);

    expect(print(step.after)).toEqual('(a + b) / 2 = 2x / 2');
  });

  test.each`
    input        | output
    ${'2x < 5'}  | ${'2x / 2 < 5 / 2'}
    ${'2x > 5'}  | ${'2x / 2 > 5 / 2'}
    ${'2x ≤ 5'}  | ${'2x / 2 ≤ 5 / 2'}
    ${'2x ≥ 5'}  | ${'2x / 2 ≥ 5 / 2'}
    ${'5 < 2x'}  | ${'5 / 2 < 2x / 2'}
    ${'5 > 2x'}  | ${'5 / 2 > 2x / 2'}
    ${'5 ≤ 2x'}  | ${'5 / 2 ≤ 2x / 2'}
    ${'5 ≥ 2x'}  | ${'5 / 2 ≥ 2x / 2'}
    ${'-2x < 5'} | ${'-2x / -2 > 5 / -2'}
    ${'-2x > 5'} | ${'-2x / -2 < 5 / -2'}
    ${'-2x ≤ 5'} | ${'-2x / -2 ≥ 5 / -2'}
    ${'-2x ≥ 5'} | ${'-2x / -2 ≤ 5 / -2'}
    ${'5 < -2x'} | ${'5 / -2 > -2x / -2'}
    ${'5 > -2x'} | ${'5 / -2 < -2x / -2'}
    ${'5 ≤ -2x'} | ${'5 / -2 ≥ -2x / -2'}
    ${'5 ≥ -2x'} | ${'5 / -2 ≤ -2x / -2'}
  `('divBothSides($input) -> $output', ({ input, output }) => {
    const ident = builders.identifier('x');
    const result = divBothSides(parseNumRel(input), ident);

    if (!result) {
      throw new Error('no result');
    }

    expect(print(result.after)).toEqual(output);
  });
});
