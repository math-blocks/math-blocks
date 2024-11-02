import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { divBothSides } from '../div-both-sides';

import type { Step } from '../../../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

const transform = (node: Semantic.types.NumericRelation): Step => {
  const ident = Semantic.builders.identifier('x');
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
    expect(Testing.print(step.value)).toEqual('2');
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
    expect(Testing.print(step.value)).toEqual('2');
  });

  it('should multiple all terms', () => {
    const before = parseNumRel('2x = a + b');
    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('2x / 2 = (a + b) / 2');
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
    const ident = Semantic.builders.identifier('x');
    const result = divBothSides(parseNumRel(input), ident);

    if (!result) {
      throw new Error('no result');
    }

    expect(Testing.print(result.after)).toEqual(output);
  });
});
