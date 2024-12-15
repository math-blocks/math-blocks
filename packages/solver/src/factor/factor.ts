import * as Semantic from '@math-blocks/semantic';

import { factorQuadratic } from './transforms/quadratic';

import type { Step } from '../types';

export function factor(node: Semantic.types.Node): Step | void {
  if (node.type !== 'Add') {
    return;
  }

  const transforms = [factorQuadratic];

  let step: Step | void = undefined;
  for (const transform of transforms) {
    step = transform(node);
    if (step) {
      break;
    }
  }

  if (step) {
    return step;
  }
}
