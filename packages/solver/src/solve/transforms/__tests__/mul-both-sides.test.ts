import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { mulBothSides } from '../mul-both-sides';

import type { Step } from '../../../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

const transform = (node: Semantic.types.NumericRelation): Step => {
  const ident = Semantic.builders.identifier('x');
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
    expect(Testing.print(step.value)).toEqual('2');
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
    expect(Testing.print(step.value)).toEqual('2');
  });

  it('should multiple all terms', () => {
    const before = parseNumRel('x / 2 = a + b');
    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('x / 2 * 2 = (a + b) * 2');
  });
});
