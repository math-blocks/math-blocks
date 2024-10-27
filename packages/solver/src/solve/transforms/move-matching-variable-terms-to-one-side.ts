import * as Semantic from '@math-blocks/semantic';

import { isTermOfIdent, flipSign } from '../util';
import { simplifyBothSides } from './simplify-both-sides';

import type { Step } from '../../types';

export function moveMatchingVariableTermsToOneSide(
  before: Semantic.types.Eq,
  variable: Semantic.types.Identifier,
): Step<Semantic.types.Eq> | void {
  const originalBefore = before;
  let [left, right] = before.args as readonly Semantic.types.NumericNode[];

  const leftTerms = Semantic.util.getTerms(left);
  const rightTerms = Semantic.util.getTerms(right);

  const leftMatchingTerms = leftTerms.filter((term) =>
    isTermOfIdent(term, variable),
  );
  const rightMatchingTerms = rightTerms.filter((term) =>
    isTermOfIdent(term, variable),
  );

  if (leftMatchingTerms.length === 0 && rightMatchingTerms.length === 0) {
    // There is no terms with the variable on either side.
    return;
  }

  // TODO: dedupe with `moveTermToSide` in move-other-terms-to-the-other-side.ts
  if (leftMatchingTerms.length > 0 && rightMatchingTerms.length > 0) {
    const substeps: Step<Semantic.types.Eq>[] = [];
    let after: Semantic.types.Node | null = null;

    // NOTE: In theory, there should only be one matching term since the terms
    // on each side should have already be simplified by collecting like terms.
    for (const matchingTerm of rightMatchingTerms) {
      const leftTerms = Semantic.util.getTerms(left);
      const rightTerms = Semantic.util.getTerms(right);

      const newLeftTerms = [...leftTerms, flipSign(matchingTerm)];
      const newRightTerms = [...rightTerms, flipSign(matchingTerm)];

      left = Semantic.builders.add(newLeftTerms);
      right = Semantic.builders.add(newRightTerms);
      after = Semantic.builders.eq([left, right]);

      substeps.push({
        message: 'do the same operation to both sides',
        before,
        after,
        substeps: [],
        operation: matchingTerm.type === Semantic.NodeType.Neg ? 'add' : 'sub',
        value: matchingTerm,
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
      message: 'move matching variable terms to one side',
      before: originalBefore,
      after,
      substeps,
      side: 'left',
    };
  }

  // The variable terms are already on one side.
  return;
}
