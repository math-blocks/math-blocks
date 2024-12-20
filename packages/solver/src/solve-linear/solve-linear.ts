import * as Semantic from '@math-blocks/semantic';

import { divBothSides } from './transforms/div-both-sides';
import { mulBothSides } from './transforms/mul-both-sides';
import { moveTermsToOneSide } from './transforms/move-terms-to-one-side';
import { simplifyBothSides } from './transforms/simplify-both-sides';

import type { Step } from '../types';

const { NodeType } = Semantic;

/**
 * Solve a linear equation for a given variable.
 *
 * @param node the equation (or system of equations) being solved
 * @param ident the variable being solved for
 */
export function solveLinear(
  node: Semantic.types.NumericRelation,
  ident: Semantic.types.Identifier,
): Step | void {
  if (
    node.args[0].type === NodeType.Identifier &&
    Semantic.util.isNumber(node.args[1])
  ) {
    return {
      message: 'solve for variable', // TODO: include variable in message
      before: node,
      after: node,
      substeps: [],
    };
  }

  if (
    node.args[1].type === NodeType.Identifier &&
    Semantic.util.isNumber(node.args[0])
  ) {
    return {
      message: 'solve for variable', // TODO: include variable in message
      before: node,
      after: node,
      substeps: [],
    };
  }

  // NOTE: We simplify both sides before and after every other transform.
  // This is so that we don't jump from something like 2x = 10 - 5 to 2x / 2 = 5 / 2.
  const transforms = [moveTermsToOneSide, divBothSides, mulBothSides].flatMap(
    (transform) => [simplifyBothSides, transform],
  );
  transforms.push(simplifyBothSides);

  const substeps: Step[] = [];
  let current = node as Semantic.types.NumericRelation;
  for (let i = 0; i < 10; i++) {
    let changed = false;
    for (const transform of transforms) {
      const next = transform(current, ident);
      if (next) {
        changed = true;
        current = next.after as Semantic.types.NumericRelation;
        substeps.push(next);
      }
    }
    if (!changed) {
      break;
    }
  }

  // If there are no steps, `solve` doesn't know how to solve this particular
  // equation yet.
  if (substeps.length === 0) {
    return;
  }

  const after = current;

  if (Semantic.util.isNumericRelation(after)) {
    const [left, right] = after.args;
    if (
      Semantic.util.deepEquals(left, ident) ||
      Semantic.util.deepEquals(right, ident)
    ) {
      return {
        message: 'solve for variable', // TODO: include variable in message
        before: node,
        after: current,
        substeps,
      };
    }
  }
}
