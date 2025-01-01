import { types } from '@math-blocks/semantic';

import { parse, newPrint as print } from '../../../test-util';
import type { Step } from '../../../types';

import { simplifyBothSides } from '../simplify-both-sides';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

const simplify = (node: types.NumericRelation): Step => {
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

    expect(print(step.after)).toMatchInlineSnapshot(`"2x=5"`);
  });
});
