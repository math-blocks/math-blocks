import * as Solver from '@math-blocks/solver';

/**
 * The next thing a student should do to make progress on a problem.
 */
export type Hint = {
  /**
   * The goal that `step` works towards, if the solver has one for this kind
   * of problem.  For linear relations this is a strategy step, such as
   * `StepKind.MoveTermsToOneSide`, `StepKind.IsolateVariable` or
   * `StepKind.SimplifyBothSides`, and its `substeps` are all the concrete
   * steps needed to reach that goal.  It's `null` for other kinds of problems.
   */
  readonly strategy: Solver.Step | null;
  /**
   * The first concrete step to take.  When `strategy` isn't `null`, this is
   * `strategy.substeps[0]`.  For example, for `2x + 5 = 10` the strategy is
   * `StepKind.MoveTermsToOneSide` and the step is
   * `StepKind.DoSameOperationToBothSides` with `operation: 'sub'` and a
   * `value` of `5`.
   */
  readonly step: Solver.Step;
};

/**
 * Returns the first step a student should take to make progress on the
 * problem, along with the strategy it belongs to (if any).
 *
 * Throws if the solver can't solve the problem.
 */
export const getHint = (problem: Solver.Problem): Hint => {
  const solution = Solver.solveProblem(problem);
  const root = solution?.steps[0];

  if (!root || root.substeps.length === 0) {
    throw new Error("Couldn't get a hint");
  }

  const first = root.substeps[0];

  // The substeps of a 'solve for variable' step are strategy steps whose
  // substeps are the concrete operations (see the `Step` type).
  if (root.kind === Solver.StepKind.SolveForVariable) {
    return {
      strategy: first,
      step: first.substeps.length > 0 ? first.substeps[0] : first,
    };
  }

  return { strategy: null, step: first };
};
