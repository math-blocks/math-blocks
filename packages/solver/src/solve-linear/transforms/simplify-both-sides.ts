import * as Semantic from '@math-blocks/semantic';

import { simplify } from '../../simplify/simplify';
import { StepKind, type Step } from '../../types';

export function simplifyBothSides(
  before: Semantic.types.NumericRelation,
): Step | void {
  const args = before.args;
  const left = simplify(args[0]);
  const right = simplify(args[1]);

  if (left && right) {
    // TODO: parameterize Step based on the return type of that step
    const after = Semantic.builders.numRel(
      [left.after, right.after],
      before.type,
    );
    return {
      kind: StepKind.SimplifyBothSides,
      message: 'simplify both sides',
      before,
      after,
      substeps: [
        {
          ...left,
          kind: StepKind.SimplifyLeftHandSide,
          message: 'simplify the left hand side',
        },
        {
          ...right,
          kind: StepKind.SimplifyRightHandSide,
          message: 'simplify the right hand side',
        },
      ],
    };
  }
  if (left) {
    // TODO: parameterize Step based on the return type of that step
    const after = Semantic.builders.numRel(
      [left.after, before.args[1]],
      before.type,
    );
    return {
      kind: StepKind.SimplifyLeftHandSide,
      message: 'simplify the left hand side',
      before,
      after,
      substeps: left.substeps,
    };
  }
  if (right) {
    // TODO: parameterize Step based on the return type of that step
    const after = Semantic.builders.numRel(
      [before.args[0], right.after],
      before.type,
    );
    return {
      kind: StepKind.SimplifyRightHandSide,
      message: 'simplify the right hand side',
      before,
      after,
      substeps: right.substeps,
    };
  }

  return;
}
