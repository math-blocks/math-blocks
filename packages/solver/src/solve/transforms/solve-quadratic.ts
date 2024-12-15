import { builders, types } from '@math-blocks/semantic';

import type { Step } from '../../types';
import { factor } from '../../factor/factor';
import { solve } from '../../solve/solve';

export function solveQuadratic(before: types.NumericRelation): Step | void {
  // Assume that the equation is in the form of ax^2 + bx + c = 0
  // In the future we can add support for ax^2 + bx + c = dx^2 + ex + f by
  // moving all terms to one side.

  const [left, right] = before.args as readonly types.Node[];

  if (left.type !== 'Add' || right.type !== 'Number') {
    return;
  }

  if (right.value !== '0') {
    return;
  }

  const substeps: Step[] = [];
  const factorStep = factor(left);

  if (!factorStep) {
    return;
  }

  substeps.push(factorStep);

  const factoredLeft = factorStep.after as types.Mul;
  const factors = factoredLeft.args;

  // TODO: support inequalities
  const relations = factors.map((factor) => {
    return builders.eq([factor, builders.number('0')]);
  });

  // @ts-expect-error: TypeScript loses the TwoOrMore<Node> type after mapping
  const seq = builders.sequence(relations);
  const splitStep: Step = {
    message: 'split factored equation',
    before: builders.eq([factoredLeft, builders.number('0')]),
    after: seq,
    substeps: [],
  };

  substeps.push(splitStep);

  const solutions: types.Node[] = [];
  for (const equation of relations) {
    // TODO: determine the variable to solve for automatically
    const step = solve(equation as types.Eq, builders.identifier('x'));
    if (!step) {
      return undefined;
    }
    substeps.push(step);
    solutions.push(step.after);
  }

  // @ts-expect-error: There isn't a way to tell TypeScript that solutions will
  // always have at least two items
  const after = builders.sequence(solutions);

  return {
    message: 'solve quadratic',
    before,
    after,
    substeps: substeps,
  };
}
