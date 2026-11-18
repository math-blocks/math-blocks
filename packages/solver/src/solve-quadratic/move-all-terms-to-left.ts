import { builders, types, util } from '@math-blocks/semantic';

/**
 * Rewrites a relation as `... = 0` (or `... < 0`, and so on) by subtracting
 * every term on the right side from the left side, e.g. `x^2 + 5x = -6`
 * becomes `x^2 + 5x + 6 = 0` and `x^2 = 5x - 6` becomes `x^2 - 5x + 6 = 0`.
 *
 * A negative term on the right, whether written as `-6` or as `- 6`, moves
 * over as its positive argument. Any other term is subtracted. The result
 * isn't simplified, so terms that cancel are left in place. A relation whose
 * right side is already `0` is returned unchanged.
 *
 * Only relations with two sides are supported; returns `undefined` for
 * chained relations such as `1 < x < 3`.
 */
export function moveAllTermsToLeft(
  relation: types.NumericRelation,
): types.NumericRelation | undefined {
  if (relation.args.length !== 2) {
    return undefined;
  }
  const [left, right] = relation.args as readonly types.Node[];
  if (right.type === 'Number' && right.value === '0') {
    return relation;
  }
  const negatedRight = util
    .getTerms(right)
    .map((term) => (term.type === 'Neg' ? term.arg : builders.neg(term, true)));
  return builders.numRel(
    [
      builders.add([...util.getTerms(left), ...negatedRight]),
      builders.number('0'),
    ],
    relation.type,
  );
}
