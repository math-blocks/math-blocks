import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

const getReciprocal = (
  node: Semantic.types.NumericNode,
): Semantic.types.NumericNode | undefined => {
  if (node.type === Semantic.NodeType.Neg) {
    const reciprocal = getReciprocal(node.arg);
    return reciprocal ? Semantic.builders.neg(reciprocal) : undefined;
  } else if (node.type === Semantic.NodeType.Div) {
    return Semantic.builders.div(node.args[1], node.args[0]);
  } else {
    return undefined;
  }
};

export function simplifyDivByFrac(
  node: Semantic.types.NumericNode,
): Step<Semantic.types.NumericNode> | void {
  if (node.type !== Semantic.NodeType.Div) {
    return undefined;
  }

  const [num, den] = node.args;
  const reciprocal = getReciprocal(den);

  if (!reciprocal) {
    return undefined;
  }

  const after = Semantic.builders.mul([num, reciprocal], true /* implicit */);

  return {
    message:
      'dividing by a fraction is the same as multiplyin by the reciprocal',
    before: node,
    after,
    substeps: [],
  };
}
