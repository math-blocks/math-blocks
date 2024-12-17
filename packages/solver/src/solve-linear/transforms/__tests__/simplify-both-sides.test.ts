import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { simplifyBothSides } from '../simplify-both-sides';

import type { Step } from '../../../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

const simplify = (node: Semantic.types.NumericRelation): Step => {
  const result = simplifyBothSides(node);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('simplify both sides', () => {
  test('2x + 5 - 5 = 10 - 5', () => {
    const before = parseNumRel('2x + 5 - 5 = 10 - 5');

    const step = simplify(before);

    expect(Testing.print(step.after)).toEqual('2x = 5');
  });
});
