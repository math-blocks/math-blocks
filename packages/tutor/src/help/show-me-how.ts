import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

import { UnreachableCaseError } from '../util';
import { getHint } from './get-hint';

const getProblemNode = (problem: Solver.Problem): Semantic.types.Node => {
  switch (problem.type) {
    case 'Factor':
    case 'SimplifyExpression':
      return problem.expression;
    case 'SolveLinearRelation':
    case 'SolveQuadraticEquation':
      return problem.relation;
    case 'SolveSystemOfEquations':
      return problem.equations;
    default:
      throw new UnreachableCaseError(problem);
  }
};

/**
 * Applies the first step of the problem's solution and returns the result.
 */
export const showMeHow = (problem: Solver.Problem): Semantic.types.Node => {
  const hint = getHint(problem);
  return Solver.applyStep(getProblemNode(problem), hint);
};
