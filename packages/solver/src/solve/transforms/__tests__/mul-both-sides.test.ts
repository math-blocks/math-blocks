import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { mulBothSides } from '../mul-both-sides';

import type { Step } from '../../../types';

const parseEq = (input: string): Semantic.types.Eq => {
  return Testing.parse(input) as Semantic.types.Eq;
};

const transform = (node: Semantic.types.Eq): Step => {
  const ident = Semantic.builders.identifier('x');
  const result = mulBothSides(node, ident);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('mulBothSides', () => {
  it('should multiple both sides (variable on left)', () => {
    const before = parseEq('x/2 = 5');
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
    const before = parseEq('5 = x/2');
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
    const before = parseEq('x / 2 = a + b');
    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('x / 2 * 2 = (a + b) * 2');
  });
});
