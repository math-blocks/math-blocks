import * as Semantic from '@math-blocks/semantic';

const { NodeType } = Semantic;

// TODO: handle non-canonicalized terms
export const getCoeff = (node: Semantic.types.Node): Semantic.types.Node => {
  if (node.type === NodeType.Neg) {
    return Semantic.builders.neg(getCoeff(node.arg));
  }
  if (node.type === NodeType.Div) {
    return Semantic.builders.div(getCoeff(node.args[0]), node.args[1]);
  }
  const factors = Semantic.util.getFactors(node);
  return Semantic.util.isNumber(factors[0])
    ? factors[0]
    : Semantic.builders.number('1');
};

// TODO: handle non-canonicalized terms
export const isTermOfIdent = (
  term: Semantic.types.Node,
  ident: Semantic.types.Identifier,
): boolean => {
  if (Semantic.util.deepEquals(ident, term)) {
    return true;
  } else if (term.type === NodeType.Mul && term.args.length === 2) {
    const [coeff, varFact] = term.args;
    if (
      Semantic.util.isNumber(coeff) &&
      Semantic.util.deepEquals(ident, varFact)
    ) {
      return true;
    }
  } else if (term.type === NodeType.Neg) {
    return isTermOfIdent(term.arg, ident);
  } else if (term.type === NodeType.Div) {
    const [num, den] = term.args;
    if (Semantic.util.isNumber(den)) {
      return isTermOfIdent(num, ident);
    }
  }
  return false;
};

export const flipSign = (node: Semantic.types.Node): Semantic.types.Node => {
  if (node.type === NodeType.Neg) {
    return node.arg;
  } else {
    return Semantic.builders.neg(node, true);
  }
};

export const convertSubTermToNeg = (
  node: Semantic.types.Node,
): Semantic.types.Node => {
  if (node.type === NodeType.Neg && node.subtraction) {
    const factors = Semantic.util.getFactors(node.arg);
    const numericFactors = factors.filter(Semantic.util.isNumber);
    const nonNumericFactors = factors.filter((f) => !Semantic.util.isNumber(f));
    const orderedFactors = [...numericFactors, ...nonNumericFactors];
    orderedFactors[0] = Semantic.builders.neg(orderedFactors[0]);
    return Semantic.builders.mul(orderedFactors, true);
  }
  return node;
};
