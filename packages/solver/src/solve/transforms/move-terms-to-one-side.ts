import * as Semantic from '@math-blocks/semantic';

import { moveMatchingVariableTermsToOneSide } from './move-matching-variable-terms-to-one-side';
import { moveOtherTermsToOneSide } from './move-other-terms-to-the-other-side';

import type { Step } from '../../types';

/**
 * Moves all terms matching `ident` to one side and those that don't to the
 * other side.
 */
export function moveTermsToOneSide(
  before: Semantic.types.Eq,
  ident: Semantic.types.Identifier,
): Step<Semantic.types.Eq> | void {
  const originalBefore = before;

  const substeps: Step<Semantic.types.Eq>[] = [];
  const step1 = moveMatchingVariableTermsToOneSide(before, ident);
  if (step1) {
    substeps.push(step1);
    before = step1.after;
  }

  const step2 = moveOtherTermsToOneSide(before, ident);
  if (step2) {
    substeps.push(step2);
  }

  if (substeps.length === 0) {
    return;
  }

  return {
    message: 'move terms to one side',
    before: originalBefore,
    after: substeps[substeps.length - 1].after,
    substeps: substeps,
  };
}
