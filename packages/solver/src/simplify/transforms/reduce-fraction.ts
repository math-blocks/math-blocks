import * as Semantic from '@math-blocks/semantic';

import { isNegative } from '../util';

import type { Step } from '../../types';

const { NodeType } = Semantic;

// TODO:
// - powers
// - negative factors
export function reduceFraction(
  node: Semantic.types.Node,
): Step<Semantic.types.Node> | void {
  if (node.type !== NodeType.Div) {
    return undefined;
  }

  if (Semantic.util.deepEquals(node.args[0], Semantic.builders.number('1'))) {
    return;
  }

  let numFactors: readonly Semantic.types.Node[] =
    node.args[0].type === NodeType.Neg
      ? Semantic.util.getFactors(node.args[0].arg)
      : Semantic.util.getFactors(node.args[0]);
  let denFactors: readonly Semantic.types.Node[] =
    node.args[1].type === NodeType.Neg
      ? Semantic.util.getFactors(node.args[1].arg)
      : Semantic.util.getFactors(node.args[1]);

  const resultIsNegative =
    isNegative(node.args[0]) !== isNegative(node.args[1]);

  const commonFactors = Semantic.util.intersection(numFactors, denFactors);

  numFactors = Semantic.util.difference(numFactors, commonFactors);
  denFactors = Semantic.util.difference(denFactors, commonFactors);

  // TODO: extract numeric factors from numerator and denominator and reduce them

  const numNums = numFactors.filter(Semantic.util.isNumber);
  const denNums = denFactors.filter(Semantic.util.isNumber);
  const numVars = numFactors.filter((node) => !Semantic.util.isNumber(node));
  const denVars = denFactors.filter((node) => !Semantic.util.isNumber(node));

  const numCoeff = Semantic.util.evalNode(Semantic.builders.mul(numNums, true));
  const denCoeff = Semantic.util.evalNode(Semantic.builders.mul(denNums, true));

  const coeff = numCoeff.div(denCoeff);

  const num =
    coeff.n !== 1
      ? Semantic.builders.mul(
          [Semantic.builders.number(coeff.n.toString()), ...numVars],
          true,
        )
      : Semantic.builders.mul(numVars, true);
  const den =
    coeff.d !== 1
      ? Semantic.builders.mul(
          [Semantic.builders.number(coeff.d.toString()), ...denVars],
          true,
        )
      : Semantic.builders.mul(denVars, true);

  let after: Semantic.types.Node;
  if (Semantic.util.deepEquals(den, Semantic.builders.number('1'))) {
    // a / 1 -> a
    after = num;
  } else if (commonFactors.length === 0 && coeff.equals(1)) {
    // If there were no common factors then we weren't able to reduce anything.
    return;
  } else {
    // a / b
    after = Semantic.builders.div(num, den);
  }

  if (resultIsNegative) {
    after = Semantic.builders.neg(after);
  }

  // Avoid infinite loops.
  if (Semantic.util.deepEquals(node, after)) {
    return;
  }

  return {
    message: 'reduce fraction',
    before: node,
    after,
    substeps: [],
  };
}
