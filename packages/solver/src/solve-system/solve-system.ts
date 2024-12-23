import { builders, types, util } from '@math-blocks/semantic';

import type { Step } from '../types';
import { solveLinear } from '../solve-linear/solve-linear';
import { simplify } from '../simplify/simplify';

// TODO: support systems of equations with more than two equations
export function solveSystem(node: types.Sequence): Step | void {
  if (node.args.length !== 2) {
    return;
  }

  const [eqn1, eqn2] = node.args;
  if (eqn1.type !== 'Equals' || eqn2.type !== 'Equals') {
    return;
  }

  if (!isLinear(node)) {
    return;
  }

  const identifiers: Set<string> = new Set();

  util.traverse(node, {
    enter: (node) => {
      if (node.type === 'Identifier') {
        identifiers.add(node.name);
      }
    },
  });

  if (identifiers.size !== 2) {
    return;
  }

  const [var1, var2] = [...identifiers].sort();

  const step1 = solveLinear(eqn1, builders.identifier(var1));
  if (!step1) {
    return;
  }
  const sol1 = step1.after;
  if (sol1?.type !== 'Equals') {
    return;
  }

  const [ident1, expr1] =
    sol1.args[0].type === 'Identifier'
      ? [sol1.args[0] as types.Identifier, sol1.args[1]]
      : [sol1.args[1] as types.Identifier, sol1.args[0]];

  const eqn2Subbed = util.traverse(eqn2, {
    exit: (node) => {
      if (node.type === 'Identifier' && node.name === ident1.name) {
        return expr1;
      }
    },
  });

  const step2 = solveLinear(eqn2Subbed as types.Eq, builders.identifier(var2));
  if (!step2) {
    return;
  }
  const sol2 = step2.after;
  if (sol2?.type !== 'Equals') {
    return;
  }

  const [ident, expr2] =
    sol2.args[0].type === 'Identifier'
      ? [sol2.args[0] as types.Identifier, sol2.args[1]]
      : [sol2.args[1] as types.Identifier, sol2.args[0]];

  const sol1Subbed = util.traverse(sol1, {
    exit: (node) => {
      if (node.type === 'Identifier' && node.name === ident.name) {
        return expr2;
      }
    },
  });

  const step3 = simplify(sol1Subbed)!;
  const sol3 = step3.after;

  return {
    message: 'solve system',
    before: builders.sequence([eqn1, eqn2]),
    after: builders.sequence([sol2, sol3]),
    substeps: [step1, step2, step3],
  };
}

export const isLinear = (node: types.Node): boolean => {
  if (node.type === 'Sequence') {
    return node.args.every(isLinear);
  }
  if (util.isNumericRelation(node)) {
    return isLinear(node.args[0]) && isLinear(node.args[1]);
  }
  if (node.type === 'Add') {
    return node.args.every(isLinear);
  }
  if (node.type === 'Neg') {
    return isLinear(node.arg);
  }
  if (node.type === 'Mul') {
    let count = 0;

    util.traverse(node, {
      enter: (node) => {
        if (node.type === 'Identifier') {
          count += 1;
        }
      },
    });

    return count <= 1;
  }
  if (node.type === 'Div') {
    let denCount = 0;

    util.traverse(node.args[1], {
      enter: (node) => {
        if (node.type === 'Identifier') {
          denCount += 1;
        }
      },
    });

    if (denCount > 0) {
      return false;
    }

    return isLinear(node.args[0]);
  }
  if (node.type === 'Identifier') {
    return true;
  }
  if (node.type === 'Number') {
    return true;
  }
  return false;
};
