import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

import type { Step } from './types';

/**
 * Applies grader steps to a node. Solver's `applySteps` only reads each
 * step's `before` and `after` nodes, so it handles grader-specific steps too.
 */
export const applySteps = (
  node: Semantic.types.Node,
  steps: readonly Step[],
): Semantic.types.Node =>
  Solver.applySteps(node, steps as readonly Solver.Step[]);
