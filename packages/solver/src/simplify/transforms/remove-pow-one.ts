import { types, util, builders, NodeType } from '@math-blocks/semantic';

import type { Step } from '../../types';

export function removePowOne(node: types.Node): Step<types.Node> | void {
  if (node.type !== NodeType.Power) {
    return;
  }
  const { base, exp } = node;
  if (util.deepEquals(exp, builders.number('1'))) {
    return {
      message: 'drop power of one',
      before: node,
      after: base,
      substeps: [],
    };
  }
}
