import { builders, types } from '@math-blocks/semantic';

import { parse, print } from '../../test-util';
import { moveAllTermsToLeft } from '../move-all-terms-to-left';

const move = (input: string): string => {
  const result = moveAllTermsToLeft(parse(input) as types.NumericRelation);
  if (!result) {
    throw new Error('no result');
  }
  return print(result);
};

describe('moveAllTermsToLeft', () => {
  it('adds a negative number', () => {
    expect(move('x^2 + 5x = -6')).toMatchInlineSnapshot(`"x^{2}+5x+6=0"`);
  });

  it('subtracts a positive number', () => {
    expect(move('x^2 + 5x = 6')).toMatchInlineSnapshot(`"x^{2}+5x-6=0"`);
  });

  it('flips the sign of a subtracted term', () => {
    expect(move('x^2 = 5x - 6')).toMatchInlineSnapshot(`"x^{2}-5x+6=0"`);
  });

  it('keeps the relation type', () => {
    expect(move('2x < x + 3')).toMatchInlineSnapshot(`"2x-x-3\\lt0"`);
  });

  it('returns the relation unchanged when the right side is zero', () => {
    const relation = parse('x^2 + 5x + 6 = 0') as types.NumericRelation;
    expect(moveAllTermsToLeft(relation)).toBe(relation);
  });

  it('returns undefined for chained relations', () => {
    const x = builders.identifier('x');
    const chained = builders.numRel(
      [builders.number('1'), x, builders.number('3')],
      'LessThan',
    );
    expect(moveAllTermsToLeft(chained)).toBeUndefined();
  });
});
