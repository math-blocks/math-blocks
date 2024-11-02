import * as Semantic from '@math-blocks/semantic';

import { isTermOfIdent } from '../util';

import type { Step } from '../../types';

const { NodeType } = Semantic;

export function mulBothSides(
  before: Semantic.types.NumericRelation,
  ident: Semantic.types.Identifier,
): Step<Semantic.types.NumericRelation> | void {
  const [left, right] = before.args as readonly Semantic.types.NumericNode[];

  if (left.source === 'divBothSides' || right.source === 'divBothSides') {
    return;
  }

  const leftTerms = Semantic.util.getTerms(left);

  if (leftTerms.length === 1 && leftTerms[0].type === NodeType.Div) {
    const [num, den] = leftTerms[0].args;
    if (isTermOfIdent(num, ident) && Semantic.util.isNumber(den)) {
      return mulByNumber(before, den);
    }
  }

  const rightTerms = Semantic.util.getTerms(right);

  if (rightTerms.length === 1 && rightTerms[0].type === NodeType.Div) {
    const [num, den] = rightTerms[0].args;
    if (isTermOfIdent(num, ident) && Semantic.util.isNumber(den)) {
      return mulByNumber(before, den);
    }
  }

  return;
}

const mulByNumber = (
  before: Semantic.types.NumericRelation,
  num: Semantic.types.NumericNode,
): Step<Semantic.types.NumericRelation> | void => {
  const [left, right] = before.args as readonly Semantic.types.NumericNode[];

  const newLeft = Semantic.builders.mul([left, num]);
  const newRight = Semantic.builders.mul([right, num]);

  newLeft.source = 'mulBothSides';
  newRight.source = 'mulBothSides';

  let opType = before.type;
  if (num.type === NodeType.Neg) {
    if (opType === NodeType.LessThan) {
      opType = NodeType.GreaterThan;
    } else if (opType === NodeType.LessThanOrEquals) {
      opType = NodeType.GreaterThanOrEquals;
    } else if (opType === NodeType.GreaterThan) {
      opType = NodeType.LessThan;
    } else if (opType === NodeType.GreaterThanOrEquals) {
      opType = NodeType.LessThanOrEquals;
    }
  }

  const after = Semantic.builders.numRel([newLeft, newRight], opType);

  return {
    message: 'do the same operation to both sides',
    before,
    after,
    substeps: [],
    operation: 'mul',
    value: num,
  };
};
