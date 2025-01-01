import { types, builders, util } from '@math-blocks/semantic';

import type { Step } from '../../types';

export const quotientRule = (
  differentiate: (node: types.Node) => Step | void,
  node: types.Div,
): Step | void => {
  const [num, den] = node.args;

  if (util.isNumber(den)) {
    const step = differentiate(num);
    if (!step) {
      return;
    }

    return {
      message: 'differentiate',
      before: node,
      after: builders.div(step.after, den),
      substeps: [step],
    };
  }

  const numStep = differentiate(num);
  const denStep = differentiate(den);

  if (!numStep || !denStep) {
    return;
  }

  const after = builders.div(
    builders.add([
      builders.mul([numStep.after, den], true),
      builders.neg(builders.mul([num, denStep.after], true), true),
    ]),
    builders.pow(den, builders.number('2')),
  );

  return {
    message: 'quotient rule',
    before: node,
    after: after,
    substeps: [numStep, denStep],
  };
};
