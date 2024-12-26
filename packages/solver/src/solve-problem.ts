import { factor } from './factor/factor';
import { simplify } from './simplify/simplify';
import { solveLinear } from './solve-linear/solve-linear';
import { solveQuadratic } from './solve-quadratic/solve-quadratic';
import { solveSystem } from './solve-system/solve-system';

import type { Problem, Solution } from './types';

export function solveProblem(problem: Problem): Solution | void {
  if (problem.type === 'Factor') {
    const step = factor(problem.expression);
    if (step) {
      return {
        steps: [step],
        answer: step.after,
      };
    }
    return;
  }

  if (problem.type === 'SimplifyExpression') {
    const step = simplify(problem.expression);
    if (step) {
      return {
        steps: [step],
        answer: step.after,
      };
    }
    return;
  }

  if (problem.type === 'SolveLinearRelation') {
    const step = solveLinear(problem.relation, problem.variable);
    if (step) {
      return {
        steps: [step],
        answer: step.after,
      };
    }
    return;
  }

  if (problem.type === 'SolveQuadraticEquation') {
    const step = solveQuadratic(problem.relation, problem.variable);
    if (step) {
      return {
        steps: [step],
        answer: step.after,
      };
    }
    return;
  }

  if (problem.type === 'SolveSystemOfEquations') {
    const step = solveSystem(problem.equations);
    if (step) {
      return {
        steps: [step],
        answer: step.after,
      };
    }
    return;
  }
}
