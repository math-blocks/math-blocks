import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { divBothSides } from '../div-both-sides';

import type { Step } from '../../../types';

const parseEq = (input: string): Semantic.types.Eq => {
  return Testing.parse(input) as Semantic.types.Eq;
};

const transform = (node: Semantic.types.Eq): Step => {
  const ident = Semantic.builders.identifier('x');
  const result = divBothSides(node, ident);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('mulBothSides', () => {
  it('should multiple both sides (variable on left)', () => {
    const before = parseEq('2x = 5');
    const step = transform(before);

    if (step.message !== 'do the same operation to both sides') {
      throw new Error(
        "expected step.message to be 'do the same operation to both sides'",
      );
    }
    expect(step.operation).toEqual('div');
    expect(Testing.print(step.value)).toEqual('2');
  });

  it('should multiple both sides (variable on right)', () => {
    const before = parseEq('5 = 2x');
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
    const before = parseEq('2x = a + b');
    const step = transform(before);

    expect(Testing.print(step.after)).toEqual('2x / 2 = (a + b) / 2');
  });
});