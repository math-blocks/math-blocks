import * as Semantic from '@math-blocks/semantic';

import { isTermOfIdent, flipSign } from '../util';
import { simplifyBothSides } from './simplify-both-sides';

import type { Step } from '../../types';

const isSubtraction = Semantic.util.isSubtraction;

export function moveOtherTermsToOneSide(
  before: Semantic.types.Eq,
  variable: Semantic.types.Identifier,
): Step<Semantic.types.Eq> | void {
  const [left, right] = before.args as readonly Semantic.types.NumericNode[];

  const leftTerms = Semantic.util.getTerms(left);
  const rightTerms = Semantic.util.getTerms(right);

  const leftMatchingTerms = leftTerms.filter((term) =>
    isTermOfIdent(term, variable),
  );
  const leftNonMatchingTerms = leftTerms.filter(
    (term) => !isTermOfIdent(term, variable),
  );
  const rightMatchingTerms = rightTerms.filter((term) =>
    isTermOfIdent(term, variable),
  );
  const rightNonMatchingTerms = rightTerms.filter(
    (term) => !isTermOfIdent(term, variable),
  );

  if (leftMatchingTerms.length === 0 && rightMatchingTerms.length === 0) {
    // There are no macthing terms on either side.
    return;
  }

  if (leftMatchingTerms.length > 0 && rightMatchingTerms.length > 0) {
    // Matching terms haven't been separated yet.
    return;
  }

  if (leftMatchingTerms.length === 0 && rightMatchingTerms.length > 0) {
    return moveTermToSide(before, rightNonMatchingTerms, 'left');
  }

  if (leftMatchingTerms.length > 0 && rightMatchingTerms.length === 0) {
    return moveTermToSide(before, leftNonMatchingTerms, 'right');
  }

  // The variable terms are already on one side.
  return;
}

const moveTermToSide = (
  before: Semantic.types.Eq,
  nonMatchingTerms: readonly Semantic.types.NumericNode[],
  side: 'left' | 'right',
): Step<Semantic.types.Eq> | void => {
  const originalBefore = before;
  let [left, right] = before.args as readonly Semantic.types.NumericNode[];

  const substeps: Step<Semantic.types.Eq>[] = [];
  let after: Semantic.types.Node | null = null;

  for (const nonMatchingTerm of nonMatchingTerms) {
    const leftTerms = Semantic.util.getTerms(left);
    const rightTerms = Semantic.util.getTerms(right);

    const newLeftTerms = [...leftTerms, flipSign(nonMatchingTerm)];
    const newRightTerms = [...rightTerms, flipSign(nonMatchingTerm)];

    left = Semantic.builders.add(newLeftTerms);
    right = Semantic.builders.add(newRightTerms);
    after = Semantic.builders.eq([left, right]);

    substeps.push({
      message: 'do the same operation to both sides',
      before,
      after,
      substeps: [],
      operation: isSubtraction(nonMatchingTerm) ? 'add' : 'sub',
      value: isSubtraction(nonMatchingTerm)
        ? nonMatchingTerm.arg
        : nonMatchingTerm,
    });
    before = after;

    // TODO: show the cancelling of terms after the addition/subtraction
    const step = simplifyBothSides(after) as void | Step<
      Semantic.types.Eq<Semantic.types.NumericNode>
    >;
    if (step) {
      after = step.after;
      substeps.push({
        message: 'simplify both sides',
        before: before,
        after: step.after,
        substeps: step.substeps,
      });
      before = after;
    }
  }

  if (!after) return;

  return {
    message: 'move other terms to the other side',
    before: originalBefore,
    after,
    substeps,
    side,
  };
};
