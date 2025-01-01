import { builders, types } from '@math-blocks/semantic';

import { parse, print } from '../../../test-util';
import type { Step } from '../../../types';

import { mulBothSides } from '../mul-both-sides';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

const transform = (node: types.NumericRelation): Step => {
  const ident = builders.identifier('x');
  const result = mulBothSides(node, ident);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('mulBothSides', () => {
  it('should multiple both sides (variable on left)', () => {
    const before = parseNumRel('x/2 = 5');
    const step = transform(before);

    if (step.message !== 'do the same operation to both sides') {
      throw new Error(
        "expected step.message to be 'do the same operation to both sides'",
      );
    }
    expect(step.operation).toEqual('mul');
    expect(print(step.value)).toMatchInlineSnapshot(`"2"`);
  });

  it('should multiple both sides (variable on right)', () => {
    const before = parseNumRel('5 = x/2');
    const step = transform(before);

    if (step.message !== 'do the same operation to both sides') {
      throw new Error(
        "expected step.message to be 'do the same operation to both sides'",
      );
    }
    expect(step.operation).toEqual('mul');
    expect(print(step.value)).toMatchInlineSnapshot(`"2"`);
  });

  it('should multiple all terms (right)', () => {
    const before = parseNumRel('x / 2 = a + b');
    const step = transform(before);

    expect(print(step.after)).toEqual('x / 2 * 2 = (a + b) * 2');
  });

  it('should multiple all terms (left)', () => {
    const before = parseNumRel('a + b = x / 2');
    const step = transform(before);

    expect(print(step.after)).toEqual('(a + b) * 2 = x / 2 * 2');
  });

  test.each`
    input           | output
    ${'x / 2 < 5'}  | ${'x / 2 * 2 < 5 * 2'}
    ${'x / 2 > 5'}  | ${'x / 2 * 2 > 5 * 2'}
    ${'x / 2 ≤ 5'}  | ${'x / 2 * 2 ≤ 5 * 2'}
    ${'x / 2 ≥ 5'}  | ${'x / 2 * 2 ≥ 5 * 2'}
    ${'5 < x / 2'}  | ${'5 * 2 < x / 2 * 2'}
    ${'5 > x / 2'}  | ${'5 * 2 > x / 2 * 2'}
    ${'5 ≤ x / 2'}  | ${'5 * 2 ≤ x / 2 * 2'}
    ${'5 ≥ x / 2'}  | ${'5 * 2 ≥ x / 2 * 2'}
    ${'x / -2 < 5'} | ${'x / -2 * -2 > 5 * -2'}
    ${'x / -2 > 5'} | ${'x / -2 * -2 < 5 * -2'}
    ${'x / -2 ≤ 5'} | ${'x / -2 * -2 ≥ 5 * -2'}
    ${'x / -2 ≥ 5'} | ${'x / -2 * -2 ≤ 5 * -2'}
    ${'5 < x / -2'} | ${'5 * -2 > x / -2 * -2'}
    ${'5 > x / -2'} | ${'5 * -2 < x / -2 * -2'}
    ${'5 ≤ x / -2'} | ${'5 * -2 ≥ x / -2 * -2'}
    ${'5 ≥ x / -2'} | ${'5 * -2 ≤ x / -2 * -2'}
  `('divBothSides($input) -> $output', ({ input, output }) => {
    const ident = builders.identifier('x');
    const result = mulBothSides(parseNumRel(input), ident);

    if (!result) {
      throw new Error('no result');
    }

    expect(print(result.after)).toEqual(output);
  });
});
