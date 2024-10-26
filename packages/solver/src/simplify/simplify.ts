import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../types';

import { addNegToSub } from './transforms/add-neg-to-sub';
import { dropParens } from './transforms/drop-parens';
import { dropAddIdentity } from './transforms/drop-add-identity';
import { evalMul, evalAdd, evalDiv } from './transforms/eval';
import { collectLikeTerms } from './transforms/collect-like-terms';
import { distribute } from './transforms/distribute';
import { distributeDiv } from './transforms/distribute-div';
import { reduceFraction } from './transforms/reduce-fraction';
import { mulFraction } from './transforms/mul-fraction';
import { mulToPow } from './transforms/mul-to-pow';
import { simplifyMul } from './transforms/simplify-mul';
import { mulByZeroIsZero } from './transforms/mul-by-zero-is-zero';
import { simplifyDivByFrac } from './transforms/simplify-div-by-frac';

export function simplify(
  node: Semantic.types.NumericNode,
): Step<Semantic.types.NumericNode> | void {
  const tranforms = [
    dropAddIdentity,

    // TODO: add a transform to convert division of fractions to multiplication
    simplifyDivByFrac,
    simplifyMul, // We do this first so that we don't repeat what it does in other transforms
    mulByZeroIsZero,

    distribute,
    distributeDiv,
    collectLikeTerms,
    dropParens,

    evalMul, // we want to eval multiplication before mulToPower to avoid (3)(3) -> 3^2
    evalAdd,
    reduceFraction,
    mulFraction,
    evalDiv,
    mulToPow,

    // We put this last so that we don't covert 3 + -(x + 1) to 3 - (x + 1)
    // before distributing.
    addNegToSub,
  ];

  const substeps: Step<Semantic.types.NumericNode>[] = [];

  const path: Semantic.types.NumericNode[] = [];
  const enter = (node: Semantic.types.NumericNode): void => {
    path.push(node);
  };

  // The inner loop attempts to apply one or more transforms to nodes in the
  // AST from the inside out.
  const exit = (
    node: Semantic.types.NumericNode,
  ): Semantic.types.NumericNode | void => {
    path.pop();
    // TODO: get rid of this check so that we can simplify other types of
    // expressions, e.g. logic expressions.
    if (Semantic.util.isNumeric(node)) {
      let current: Semantic.types.NumericNode = node;
      for (let i = 0; i < 10; i++) {
        let step: Step<Semantic.types.NumericNode> | void = undefined;
        for (const transform of tranforms) {
          step = transform(current, path);
          // Multiple transforms can be applied to the current node.
          if (step) {
            break;
          }
        }

        // None of the transforms suceeded
        if (!step) {
          return current;
        }

        // Update the current node so that we can attemp to transform
        // it again.
        current = step.after;
        substeps.push(step);
      }
    }
  };

  // The outer loop traverses the tree multiple times until the inner loop
  // is no longer making any changes to the AST.
  let current = node;
  for (let i = 0; i < 10; i++) {
    const next = Semantic.util.traverseNumeric(current, { enter, exit });
    if (next === current) {
      break;
    }
    current = next;
  }

  if (substeps.length > 0) {
    return {
      message: 'simplify expression',
      before: node,
      after: current,
      substeps,
    };
  }

  return undefined;
}
