import { builders, types, util } from '@math-blocks/semantic';

import { divByCoeff } from './transforms/div-both-sides';
import { mulByNumber } from './transforms/mul-both-sides';
import { simplifyBothSides } from './transforms/simplify-both-sides';
import { isLinear } from '../solve-system/solve-system';

import { Step, NumberOfSolutions } from '../types';
import { print } from '@math-blocks/testing';
import Fraction from 'fraction.js';

/**
 * Solve a linear equation for a given variable.
 *
 * @param node the equation (or system of equations) being solved
 * @param ident the variable being solved for
 */
export function solveLinear(
  node: types.NumericRelation,
  ident: types.Identifier,
): Extract<Step, { message: 'solve for variable' }> | void {
  if (!isLinear(node)) {
    return;
  }

  // Checks if the equation is already solved for the variable.
  if (isIdentifier(node.args[0]) && util.isNumber(node.args[1])) {
    return {
      message: 'solve for variable',
      before: node,
      after: node,
      substeps: [],
      numberOfSolutions: NumberOfSolutions.One,
    };
  }

  // Checks if the equation is already solved for the variable.
  if (isIdentifier(node.args[1]) && util.isNumber(node.args[0])) {
    return {
      message: 'solve for variable',
      before: node,
      after: node,
      substeps: [],
      numberOfSolutions: NumberOfSolutions.One,
    };
  }

  // TODO:
  // - simplifyBothSides
  // - determine which side the variable we want to solve for is on
  // - move all other terms to the other side, but move them one by one
  const substeps: Step[] = [];

  // Simplify the each side of the relation before proceeding
  let step = simplifyBothSides(node);
  if (step) {
    substeps.push(step);
  }
  let rel = (step?.after as types.NumericRelation) ?? node;

  print(rel); // ?

  // Check if anyone of the variables are inside fractions
  const denominators: number[] = [];
  for (const term of util.getTerms(rel.args[0])) {
    if (term.type === 'Div') {
      const variables = getVariables(term.args[0]);
      if (variables.length === 1) {
        denominators.push(parseInt(print(term.args[1])));
      }
    }
  }
  for (const term of util.getTerms(rel.args[1])) {
    if (term.type === 'Div') {
      const variables = getVariables(term.args[0]);
      if (variables.length === 1) {
        denominators.push(parseInt(print(term.args[1])));
      }
    }
  }

  const leftHasIdent = util.getTerms(rel.args[0]).some((term) => {
    const variables = getVariables(term);
    return variables.some((variable) => variable.name === ident.name);
  });
  const rightHasIdent = util.getTerms(rel.args[1]).some((term) => {
    const variables = getVariables(term);
    return variables.some((variable) => variable.name === ident.name);
  });

  // If the variable we're solving for isn't on either side of the equation,
  // then we can't solve the equation for that variable.
  if (!leftHasIdent && !rightHasIdent) {
    // TODO: handle the case where the equation still contains other variables
    const numberOfSolutions = util.deepEquals(rel.args[0], rel.args[1])
      ? NumberOfSolutions.Infinite
      : NumberOfSolutions.None;

    return {
      message: 'solve for variable',
      before: node,
      after: rel,
      substeps: substeps,
      numberOfSolutions,
    };
  }

  // If the variable exists on the left side, then we want to move all terms
  // to the right.  Otherwise, we want to move all terms to the left.
  // TODO: handle the case where the variable exists on both sides.
  const dir = leftHasIdent ? 'right' : 'left';

  const termsToMove =
    dir === 'right'
      ? getTermsToMove(util.getTerms(rel.args[0]), ident)
      : getTermsToMove(util.getTerms(rel.args[1]), ident);

  termsToMove.reverse();

  // eslint-disable-next-line no-constant-condition
  for (const termToMove of termsToMove) {
    // Move each term that doesn't contain the variable we're solving
    // for from the left side to the right.
    step = moveTerm(rel, dir, termToMove);
    if (!step) {
      break;
    }
    substeps.push(step);

    // Simplify the relation after moving the term.  We do this as a
    // separate step so that it's easier to see what's happening.
    // TODO: make this return a Step<types.NumericRelation>
    step = simplifyBothSides(step.after as types.NumericRelation);
    if (!step) {
      return;
    }
    substeps.push(step);
    rel = step.after as types.NumericRelation;
  }

  if (leftHasIdent && rightHasIdent) {
    const [, right] = rel.args;
    const terms = util.getTerms(right).filter((term) => {
      const variables = getVariables(term);
      if (variables.length === 0) {
        return false;
      } else if (variables.length === 1) {
        return variables[0].name === ident.name;
      } else {
        throw new Error('unexpected non-linear term');
      }
    });

    if (terms.length !== 1) {
      return;
    }

    step = moveTerm(rel, 'left', terms[0]);
    if (!step) {
      return;
    }
    substeps.push(step);

    step = simplifyBothSides(step.after as types.NumericRelation);
    if (!step) {
      return;
    }
    substeps.push(step);
    rel = step.after as types.NumericRelation;
  }

  const [left, right] = rel.args;

  const coeff =
    dir === 'right'
      ? getCoeff(util.getTerms(left)[0])
      : getCoeff(util.getTerms(right)[0]);

  if (coeff.n === 0) {
    // TODO: handle the case where the equation still contains other variables
    const numberOfSolutions = util.deepEquals(left, right)
      ? NumberOfSolutions.Infinite
      : NumberOfSolutions.None;

    return {
      message: 'solve for variable',
      before: node,
      after: rel,
      substeps: substeps,
      numberOfSolutions,
    };
  }

  if (!coeff.equals(1)) {
    if (coeff.d !== 1) {
      const step = mulByNumber(rel, builders.number(coeff.d.toString()));
      if (!step) {
        return;
      }
      substeps.push(step);
      rel = step.after as types.NumericRelation;

      const simpStep = simplifyBothSides(rel);
      if (simpStep) {
        substeps.push(simpStep);
        rel = simpStep.after as types.NumericRelation;
      }
    }
    if (coeff.n !== 1) {
      const step =
        coeff.s === -1
          ? divByCoeff(rel, builders.number((-1 * coeff.n).toString()))
          : divByCoeff(rel, builders.number(coeff.n.toString()));
      if (!step) {
        return;
      }
      substeps.push(step);
      rel = step.after as types.NumericRelation;

      const simpStep = simplifyBothSides(rel);
      if (simpStep) {
        substeps.push(simpStep);
        rel = simpStep.after as types.NumericRelation;
      }
    }

    return {
      message: 'solve for variable',
      before: node,
      after: rel,
      substeps: substeps,
      numberOfSolutions: NumberOfSolutions.One,
    };
  }

  return {
    message: 'solve for variable',
    before: node,
    after: rel,
    substeps: substeps,
    numberOfSolutions: NumberOfSolutions.One,
  };
}

const getTermsToMove = (
  terms: readonly types.Node[],
  ident: types.Identifier, // the variable we're solving for
) => {
  return terms.filter((term) => {
    const variables = getVariables(term);
    if (variables.length === 0) {
      return true;
    } else if (variables.length === 1) {
      return variables[0].name !== ident.name;
    } else {
      throw new Error('unexpected non-linear term');
    }
  });
};

const moveTerm = (
  node: types.NumericRelation,
  dir: 'left' | 'right',
  // This is the identifier we don't want to move
  // TODO: change this so that we pass the term we want to move
  termToMove: types.Node,
): Step<types.NumericRelation> | undefined => {
  if (dir === 'left') {
    const reversedNode = builders.numRel(
      [node.args[1], node.args[0]],
      node.type,
    );
    const reversedStep = moveTerm(reversedNode, 'right', termToMove);
    if (!reversedStep) {
      return;
    }
    const rel = reversedStep.after;
    return {
      message: 'move terms to one side', // TODO: change this to 'move term to one side'
      before: node,
      after: builders.numRel([rel.args[1], rel.args[0]], node.type),
      substeps: reversedStep.substeps,
    };
  }

  const [left, right] = node.args;

  const leftTerms = util.getTerms(left);
  const rightTerms = util.getTerms(right);

  const leftTerm = termToMove;
  const rightTerm = rightTerms.find((term) => {
    const lvars = getVariables(leftTerm);
    const rvars = getVariables(term);

    if (lvars.length === 0 && rvars.length === 0) {
      return true;
    } else if (lvars.length === 1 && rvars.length === 1) {
      return lvars[0].name === rvars[0].name;
    }
  });

  let leftIndex = leftTerms.findIndex((term) => term === leftTerm);
  if (leftIndex === -1) {
    leftIndex = leftTerms.length - 1;
  }
  let rightIndex = rightTerms.findIndex((term) => term === rightTerm);
  if (rightIndex === -1) {
    rightIndex = rightTerms.length - 1;
  }

  const newTerm =
    leftTerm.type === 'Neg' ? leftTerm.arg : builders.neg(leftTerm, true);

  const newLeftTerms = insert(leftTerms, leftIndex + 1, newTerm);
  const newRightTerms = insert(rightTerms, rightIndex + 1, newTerm);

  const newLeft = builders.add(newLeftTerms);
  const newRight = builders.add(newRightTerms);

  const rel2 = builders.numRel([newLeft, newRight], node.type);

  return {
    message: 'move terms to one side',
    before: node,
    after: rel2,
    substeps: [],
  };
};

const isIdentifier = (node: types.Node): node is types.Identifier => {
  return node.type === 'Identifier';
};

// Assumes that node is a constant or monomial
const getVariables = (node: types.Node): types.Identifier[] => {
  if (node.type === 'Neg') {
    return getVariables(node.arg);
  } else if (node.type === 'Div') {
    return getVariables(node.args[0]);
  } else {
    const factors = util.getFactors(node);
    return factors.filter(isIdentifier);
  }
};

// TODO: dedupe with quadratic.ts
const getFactors = (node: types.Node): OneOrMore<types.Node> => {
  if (node.type === 'Mul') {
    return node.args;
  } else if (node.type === 'Neg') {
    return [builders.number('-1'), ...getFactors(node.arg)];
  } else {
    return [node];
  }
};

// TODO: dedupe with quadratic.ts
function getCoeff(node: types.Node): Fraction {
  if (node.type === 'Div') {
    return getCoeff(node.args[0]).div(getCoeff(node.args[1]));
  }
  if (node.type === 'Neg') {
    return getCoeff(node.arg).neg();
  }
  const factors = getFactors(node);
  const constFactors = factors.filter((factor) => util.isNumber(factor));
  builders.mul(constFactors, true);
  return util.evalNode(builders.mul(constFactors, true));
}

const insert = <T>(arr: readonly T[], index: number, item: T): T[] => {
  return [...arr.slice(0, index), item, ...arr.slice(index)];
};
