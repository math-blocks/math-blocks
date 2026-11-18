import { types, util, builders, NodeType } from '@math-blocks/semantic';

import { StepKind, type Step } from '../../types';

export function removePowOne(node: types.Node): Step | void {
  if (node.type !== NodeType.Power) {
    return;
  }
  const { base, exp } = node;
  if (util.deepEquals(exp, builders.number('1'))) {
    return {
      kind: StepKind.DropPowerOfOne,
      message: 'drop power of one',
      before: node,
      after: base,
      substeps: [],
    };
  }
}
