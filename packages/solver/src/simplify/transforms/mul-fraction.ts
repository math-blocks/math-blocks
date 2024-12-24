import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

const { NodeType } = Semantic;

// TODO: Don't multiply (3/2)(n) to 3n/2
export function mulFraction(
  node: Semantic.types.Node,
): Step<Semantic.types.Node> | void {
  if (
    node.type === NodeType.Mul &&
    node.args.some((arg) => arg.type === NodeType.Div)
  ) {
    const numFactors: Semantic.types.Node[] = [];
    const denFactors: Semantic.types.Node[] = [];

    // TODO: Figure out why this breaks so many other tests
    // if (
    //   node.args[0].type === NodeType.Div &&
    //   Semantic.util.isNumber(node.args[0]) &&
    //   node.args.slice(1).every((node) => !Semantic.util.isNumber(node))
    // ) {
    //   return;
    // }

    for (const factor of node.args) {
      if (factor.type === NodeType.Div) {
        const [num, den] = factor.args;
        numFactors.push(...Semantic.util.getFactors(num));
        denFactors.push(...Semantic.util.getFactors(den));
      } else {
        numFactors.push(factor);
      }
    }

    const after = Semantic.builders.div(
      Semantic.builders.mul(numFactors, true),
      Semantic.builders.mul(denFactors, true),
    );

    return {
      // TODO: customize the message depending on whether there are one
      // or more factors that are fractions.
      message: 'multiply fraction(s)',
      before: node,
      after,
      substeps: [],
    };
  }

  return undefined;
}
