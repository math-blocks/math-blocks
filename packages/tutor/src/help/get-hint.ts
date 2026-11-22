import * as Solver from '@math-blocks/solver';

/**
 * Returns the first step a student should take to make progress on the
 * problem.
 *
 * Throws if the solver can't solve the problem.
 */
export const getHint = (problem: Solver.Problem): Solver.Step => {
  const solution = Solver.solveProblem(problem);

  if (solution && solution.steps[0].substeps.length > 0) {
    // Grab the first step of the solution and apply it to the previous
    // math statement that the user has entered.
    return solution.steps[0].substeps[0];
  }

  throw new Error("Couldn't get a hint");
};
