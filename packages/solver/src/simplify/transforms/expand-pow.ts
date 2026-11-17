import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

import { distribute } from './distribute';

const { NodeType } = Semantic;

/**
 * Expands the square of a sum, e.g.
 * (x + 1)^2 -> (x + 1)(x + 1) -> (x + 1)x + (x + 1).  The remaining
 * distribution and collecting of like terms is left to other transforms.
 *
 * We distribute right away instead of returning (x + 1)(x + 1) because
 * mulToPow would otherwise turn it back into (x + 1)^2 before the parent node
 * gets a chance to distribute it, e.g. when the power is a term in a sum.
 *
 * Powers inside a fraction are left alone so that factors can still cancel,
 * e.g. (x + 1)^2 / (x + 1), and so that 1 / (x + 1)^2 isn't rewritten as
 * 1 / (x^2 + 2x + 1).
 *
 * TODO: handle higher powers.  (x + 1)^3 distributes into terms like
 * x(x + 1)^2, and the steps that come from expanding those inner powers can't
 * be applied to the original expression, so we leave cubes alone for now.
 */
export function expandPow(
  node: Semantic.types.Node,
  path: readonly Semantic.types.Node[],
): Step<Semantic.types.Node> | void {
  if (node.type !== NodeType.Power) {
    return;
  }
  const { base, exp } = node;
  if (
    base.type !== NodeType.Add ||
    exp.type !== NodeType.Number ||
    exp.value !== '2'
  ) {
    return;
  }
  if (path.some((ancestor) => ancestor.type === NodeType.Div)) {
    return;
  }

  const mul = Semantic.builders.mul([base, base], true);

  const expandStep: Step<Semantic.types.Node> = {
    message: 'a power is repeated multiplication',
    before: node,
    after: mul,
    substeps: [],
  };

  // Passing an empty path lets `distribute` act on `mul` even when `node` is
  // a term in a sum.  `distribute` always handles a product of two sums.  If
  // that ever changes, we leave the power alone rather than return
  // (x + 1)(x + 1), which mulToPow would turn straight back into (x + 1)^2.
  const distributeStep = distribute(mul, []);
  if (!distributeStep) {
    return undefined;
  }

  return {
    message: 'expand power',
    before: node,
    after: distributeStep.after,
    substeps: [expandStep, distributeStep],
  };
}
