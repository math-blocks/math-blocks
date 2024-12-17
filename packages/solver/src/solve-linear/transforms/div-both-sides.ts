import * as Semantic from '@math-blocks/semantic';

import { getCoeff, isTermOfIdent } from '../util';

import type { Step } from '../../types';

const { NodeType } = Semantic;

export function divBothSides(
  before: Semantic.types.NumericRelation,
  ident: Semantic.types.Identifier,
): Step<Semantic.types.NumericRelation> | void {
  const [left, right] = before.args as readonly Semantic.types.Node[];

  // Prevent an infinite loop between these two transforms
  if (left.source === 'mulBothSides' || right.source === 'mulBothSides') {
    return undefined;
  }

  const leftTerms = Semantic.util.getTerms(left);
  const rightTerms = Semantic.util.getTerms(right);

  const leftIdentTerms = leftTerms.filter((term) => isTermOfIdent(term, ident));
  const rightIdentTerms = rightTerms.filter((term) =>
    isTermOfIdent(term, ident),
  );

  const leftNonIdentTerms = leftTerms.filter(
    (term) => !isTermOfIdent(term, ident),
  );
  const rightNonIdentTerms = rightTerms.filter(
    (term) => !isTermOfIdent(term, ident),
  );

  if (leftIdentTerms.length === 1 && leftNonIdentTerms.length === 0) {
    const coeff = getCoeff(leftIdentTerms[0]);
    return divByCoeff(before, coeff);
  }

  if (rightIdentTerms.length === 1 && rightNonIdentTerms.length === 0) {
    const coeff = getCoeff(rightIdentTerms[0]);
    return divByCoeff(before, coeff);
  }
}

const divByCoeff = (
  before: Semantic.types.NumericRelation,
  coeff: Semantic.types.Node,
): Step<Semantic.types.NumericRelation> | void => {
  if (coeff.type === NodeType.Div) {
    return;
  }

  if (Semantic.util.deepEquals(coeff, Semantic.builders.number('1'))) {
    return;
  }

  // TODO: add a check to make sure this is true
  const args = before.args as TwoOrMore<Semantic.types.Node>;

  let opType = before.type;
  if (coeff.type === NodeType.Neg) {
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

  const after = Semantic.builders.numRel(
    args.map((arg) => {
      const result = Semantic.builders.div(arg as Semantic.types.Node, coeff);
      result.source = 'divBothSides';
      return result;
    }) as unknown as TwoOrMore<Semantic.types.Node>,
    opType,
  );

  return {
    message: 'do the same operation to both sides',
    before,
    after,
    substeps: [],
    operation: 'div',
    value: coeff,
  };
};
