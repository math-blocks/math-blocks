import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

const { NodeType } = Semantic;

// TODO: backport this to @math-blocks/semantic
const evalNode = (node: Semantic.types.Node): Semantic.types.Node => {
  const result = Semantic.util.evalNode(node);
  if (result.d === 1) {
    if (result.s === 1) {
      return Semantic.builders.number(result.n.toString());
    } else {
      return Semantic.builders.neg(
        Semantic.builders.number(result.n.toString()),
      );
    }
  } else {
    if (result.s === 1) {
      return Semantic.builders.div(
        Semantic.builders.number(result.n.toString()),
        Semantic.builders.number(result.d.toString()),
      );
    } else {
      return Semantic.builders.neg(
        Semantic.builders.div(
          Semantic.builders.number(result.n.toString()),
          Semantic.builders.number(result.d.toString()),
        ),
      );
    }
  }
};

// This function will evaluate the multiple any factors that are numbers in node
// but won't touch any non-number terms, e.g.
// (2)(x)(3)(y) -> 6xy
// TODO: figure out why using our local version of getFactors breaks things.
export function evalMul(
  node: Semantic.types.Node,
): Step<Semantic.types.Node> | void {
  if (!Semantic.util.isNumeric(node)) {
    return;
  }
  const factors = Semantic.util.getFactors(node);

  const numericFactors = factors.filter(Semantic.util.isNumber);
  const nonNumericFactors = factors.filter((f) => !Semantic.util.isNumber(f));

  if (numericFactors.length > 1) {
    const coeff = evalNode(Semantic.builders.mul(numericFactors));

    return {
      message: 'evaluate multiplication',
      before: node,
      after: Semantic.builders.mul([coeff, ...nonNumericFactors], true),
      substeps: [],
    };
  }

  return undefined;
}

export function evalAdd(
  node: Semantic.types.Node,
): Step<Semantic.types.Node> | void {
  if (!Semantic.util.isNumeric(node)) {
    return;
  }
  const terms = Semantic.util.getTerms(node);

  const numericTerms = terms.filter(Semantic.util.isNumber);
  const nonNumericTerms = terms.filter((f) => !Semantic.util.isNumber(f));

  if (numericTerms.length > 1) {
    const sum = evalNode(Semantic.builders.add(numericTerms));

    return {
      message: 'evaluate addition',
      before: node,
      after: Semantic.builders.mul([...nonNumericTerms, sum], true),
      substeps: [],
    };
  }

  return undefined;
}

// TODO: if the fraction is in lowest terms or otherwise can't be modified, don't
// process it.
export function evalDiv(
  node: Semantic.types.Node,
): Step<Semantic.types.Node> | void {
  if (node.type !== NodeType.Div) {
    return;
  }

  if (!Semantic.util.isNumber(node)) {
    return;
  }

  const [numerator, denominator] = node.args;

  if (Semantic.util.deepEquals(numerator, Semantic.builders.number('1'))) {
    return;
  }

  const result = Semantic.util.evalNode(node);
  let after: Semantic.types.Node;
  if (result.d === 1) {
    if (result.s === 1) {
      after = Semantic.builders.number(result.n.toString());
    } else {
      after = Semantic.builders.neg(
        Semantic.builders.number(result.n.toString()),
      );
    }
  } else {
    if (result.s === 1) {
      after = Semantic.builders.div(
        Semantic.builders.number(result.n.toString()),
        Semantic.builders.number(result.d.toString()),
      );
    } else {
      after = Semantic.builders.neg(
        Semantic.builders.div(
          Semantic.builders.number(result.n.toString()),
          Semantic.builders.number(result.d.toString()),
        ),
      );
    }
  }

  // TODO: handle negative fractions
  if (
    Semantic.util.deepEquals(
      numerator,
      Semantic.builders.number(String(result.n)),
    ) &&
    Semantic.util.deepEquals(
      denominator,
      Semantic.builders.number(String(result.d)),
    )
  ) {
    return;
  }

  return {
    message: 'evaluate division',
    before: node,
    after,
    substeps: [],
  };
}
