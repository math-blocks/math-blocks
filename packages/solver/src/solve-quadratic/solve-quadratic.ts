import { builders, types } from '@math-blocks/semantic';

import type { Step } from '../types';
import { factor } from '../factor/factor';
import { solveLinear } from '../solve-linear/solve-linear';

export function solveQuadratic(
  before: types.NumericRelation,
  ident: types.Identifier,
): Step | void {
  // This code assumes that the equation is in the form of ax^2 + bx + c = 0.
  // TODO: In the future we can add support for ax^2 + bx + c = dx^2 + ex + f by
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

  substeps.push({ ...factorStep, section: true });

  const factoredLeft = factorStep.after as types.Mul;
  const factors = factoredLeft.args;
  const relType = before.type;

  const relations = factors.map((factor) => {
    return builders.numRel([factor, builders.number('0')], relType);
  });

  // @ts-expect-error: TypeScript loses the TwoOrMore<Node> type after mapping
  const seq = builders.sequence(relations);
  const splitStep: Step = {
    message: 'split factored equation',
    before: builders.eq([factoredLeft, builders.number('0')]),
    after: seq,
    substeps: [],
  };

  substeps.push({ ...splitStep, section: true });

  const solutions: types.Node[] = [];
  for (const equation of relations) {
    const step = solveLinear(equation as types.Eq, ident);
    if (!step) {
      return undefined;
    }
    substeps.push({ ...step, section: true });
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
