import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

const { NodeType } = Semantic;

const isZero = (node: Semantic.types.Node): boolean => {
  if (node.type === NodeType.Number && node.value === '0') {
    return true;
  } else if (node.type === NodeType.Neg) {
    return isZero(node.arg);
  } else {
    return false;
  }
};

export function mulByZeroIsZero(
  node: Semantic.types.Node,
): Step<Semantic.types.Node> | void {
  const factors = Semantic.util.getFactors(node);
  if (factors.length > 1 && factors.some(isZero)) {
    return {
      message: 'multiplying by zero is equivalent to zero',
      before: node,
      after: Semantic.builders.number('0'),
      substeps: [],
    };
  }
}
