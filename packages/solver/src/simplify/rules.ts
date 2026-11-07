import type { Rule } from '../rewrite/types';
import type { Transform } from '../types';

import { simplify } from './simplify';
import { addNegToSub } from './transforms/add-neg-to-sub';
import { dropParens } from './transforms/drop-parens';
import { dropAddIdentity } from './transforms/drop-add-identity';
import { evalMul, evalAdd, evalDiv } from './transforms/eval';
import { collectLikeTerms } from './transforms/collect-like-terms';
import { distribute } from './transforms/distribute';
import { distributeDiv } from './transforms/distribute-div';
import { reduceFraction } from './transforms/reduce-fraction';
import { mulFraction } from './transforms/mul-fraction';
import { simplifyMul } from './transforms/simplify-mul';
import { mulByZeroIsZero } from './transforms/mul-by-zero-is-zero';
import { simplifyDivByFrac } from './transforms/simplify-div-by-frac';
import { removePowOne } from './transforms/remove-pow-one';
import { mulToPow } from './transforms/mul-to-pow';
import { multiplyPowers } from './transforms/multiply-powers';
import { dividePowers } from './transforms/divide-powers';

/**
 * Wraps a transform as a rule. The rule calls the transform exactly as
 * `simplify()` does, with the node's ancestors as `path`, and yields the step
 * it returns, if any.
 */
const fromTransform = (id: string, transform: Transform): Rule => ({
  id,
  *apply(node, context) {
    const step = transform(node, context.path, simplify);
    if (step) {
      yield step;
    }
  },
});

export const dropAddIdentityRule = fromTransform(
  'drop-add-identity',
  dropAddIdentity,
);
export const simplifyDivByFracRule = fromTransform(
  'simplify-div-by-frac',
  simplifyDivByFrac,
);
export const simplifyMulRule = fromTransform('simplify-mul', simplifyMul);
export const mulByZeroIsZeroRule = fromTransform(
  'mul-by-zero-is-zero',
  mulByZeroIsZero,
);
export const distributeRule = fromTransform('distribute', distribute);
export const distributeDivRule = fromTransform('distribute-div', distributeDiv);
export const collectLikeTermsRule = fromTransform(
  'collect-like-terms',
  collectLikeTerms,
);
export const dropParensRule = fromTransform('drop-parens', dropParens);
export const evalMulRule = fromTransform('eval-mul', evalMul);
export const evalAddRule = fromTransform('eval-add', evalAdd);
export const reduceFractionRule = fromTransform(
  'reduce-fraction',
  reduceFraction,
);
export const mulFractionRule = fromTransform('mul-fraction', mulFraction);
export const evalDivRule = fromTransform('eval-div', evalDiv);
export const mulToPowRule = fromTransform('mul-to-pow', mulToPow);
export const multiplyPowersRule = fromTransform(
  'multiply-powers',
  multiplyPowers,
);
export const dividePowersRule = fromTransform('divide-powers', dividePowers);
export const removePowOneRule = fromTransform('remove-pow-one', removePowOne);
export const addNegToSubRule = fromTransform('add-neg-to-sub', addNegToSub);

/**
 * The rules for every transform `simplify()` uses, in the order it tries
 * them. Keep this in the same order as the `tranforms` array in
 * `simplify.ts`; see the comments there for why the order matters.
 */
export const simplifyRules: readonly Rule[] = [
  dropAddIdentityRule,

  simplifyDivByFracRule,
  simplifyMulRule,
  mulByZeroIsZeroRule,

  distributeRule,
  distributeDivRule,
  collectLikeTermsRule,
  dropParensRule,

  evalMulRule,
  evalAddRule,
  reduceFractionRule,
  mulFractionRule,
  evalDivRule,
  mulToPowRule,
  multiplyPowersRule,
  dividePowersRule,
  removePowOneRule,

  addNegToSubRule,
];
