import { types, builders } from '@math-blocks/semantic';

import type { Step } from '../../types';

export const powerRule = (
  differentiate: (node: types.Node) => Step | void,
  node: types.Pow,
): Step | void => {
  if (node.base.type === 'Identifier') {
    if (node.base.name === 'x') {
      return {
        message: 'power rule',
        before: node,
        after: builders.mul(
          [
            node.exp,
            builders.pow(
              node.base,
              builders.add([
                node.exp,
                builders.neg(builders.number('1'), true),
              ]),
            ),
          ],
          true,
        ),
        substeps: [],
      };
    } else if (node.base.name === 'e') {
      const step = differentiate(node.exp); // chain rule
      if (!step) {
        return;
      }

      return {
        message: 'chain rule',
        before: node,
        after: builders.mul([step.after, node], true),
        substeps: [step],
      };
    } else {
      // treat the base as a constant
    }
  }
};
