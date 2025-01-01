import { types, builders, util } from '@math-blocks/semantic';

import type { Step } from '../../types';

export const productRule = (
  differentiate: (node: types.Node) => Step | void,
  node: types.Mul,
): Step | void => {
  const factors = util.getFactors(node);

  const numFactors = factors.filter(util.isNumber);
  const varFactors = factors.filter((node) => !util.isNumber(node));

  if (numFactors.length > 0) {
    const step = differentiate(builders.mul(varFactors, true));
    if (!step) {
      return;
    }
    const sol = builders.mul([...numFactors, step.after], true);
    return {
      message: 'differentiate',
      before: node,
      after: sol,
      substeps: [step],
    };
  }

  // TODO: handle more than two factors
  if (factors.length === 2) {
    const [left, right] = factors;

    const leftStep = differentiate(left);
    const rightStep = differentiate(right);

    if (!leftStep || !rightStep) {
      return;
    }

    const sol = builders.add([
      builders.mul(
        [leftStep.after, right].filter(
          (node) => !util.deepEquals(node, builders.number('1')),
        ),
        true,
      ),
      builders.mul(
        [left, rightStep.after].filter(
          (node) => !util.deepEquals(node, builders.number('1')),
        ),
        true,
      ),
    ]);

    return {
      message: 'product rule',
      before: node,
      after: sol,
      substeps: [leftStep, rightStep],
    };
  }
};
