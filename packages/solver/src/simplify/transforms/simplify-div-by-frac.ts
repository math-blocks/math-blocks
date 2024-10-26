import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

export function simplifyDivByFrac(
  node: Semantic.types.NumericNode,
): Step<Semantic.types.NumericNode> | void {
  if (node.type !== Semantic.NodeType.Div) {
    return undefined;
  }

  const [num, den] = node.args;

  // TODO: handle the cases where either the numerator or denominator are
  // negative but not both.
  if (
    node.args[0].type === Semantic.NodeType.Neg &&
    node.args[1].type === Semantic.NodeType.Neg
  ) {
    const den = node.args[1].arg;
    if (den.type !== Semantic.NodeType.Div) {
      return undefined;
    }
    const reciprocal = Semantic.builders.div(den.args[1], den.args[0]);
    const after = Semantic.builders.mul(
      [num, Semantic.builders.neg(reciprocal)],
      true, // implicit
    );
    return {
      message:
        'dividing by a fraction is the same as multiplyin by the reciprocal',
      before: node,
      after,
      substeps: [],
    };
  }

  // TODO: handle case where numerator isn't a div node
  if (
    num.type !== Semantic.NodeType.Div ||
    den.type !== Semantic.NodeType.Div
  ) {
    return undefined;
  }

  const reciprocal = Semantic.builders.div(den.args[1], den.args[0]);
  const after = Semantic.builders.mul([num, reciprocal]);

  return {
    message:
      'dividing by a fraction is the same as multiplyin by the reciprocal',
    before: node,
    after,
    substeps: [],
  };
}
