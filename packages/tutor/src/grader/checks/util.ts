import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

import type { Context, Result } from '../types';

const { NodeType } = Semantic;

// TODO: handle negative numbers
export const primeDecomp = (n: number): readonly number[] => {
  if (!Number.isInteger(n)) {
    return [];
  }

  const factors: number[] = [];
  let p = 2;
  while (n >= p * p) {
    if (n % p === 0) {
      factors.push(p);
      n = n / p;
    } else {
      p = p + 1;
    }
  }
  factors.push(n);

  return factors;
};

export const zip = <A, B>(
  a: readonly A[],
  b: readonly B[],
): readonly [A, B][] => {
  const result: [A, B][] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    result.push([a[i], b[i]]);
  }
  return result;
};

export const decomposeFactors = (
  factors: readonly Semantic.types.NumericNode[],
): readonly Semantic.types.NumericNode[] => {
  return factors.reduce((result: Semantic.types.NumericNode[], factor) => {
    // TODO: add decomposition of powers
    if (factor.type === NodeType.Number) {
      return [
        ...result,
        ...primeDecomp(parseInt(factor.value)).map((value) =>
          Semantic.builders.number(String(value)),
        ),
      ];
    } else {
      return [...result, factor];
    }
  }, []);
};

const isNode = (val: unknown): val is Semantic.types.Node => {
  return Object.prototype.hasOwnProperty.call(val, 'type');
};

export const findNodeById = (
  root: Semantic.types.Node,
  id: number,
): Semantic.types.Node | void => {
  if (root.id === id) {
    return root;
  }
  for (const val of Object.values(root)) {
    if (!val) {
      continue;
    }
    if (isNode(val)) {
      const result = findNodeById(val, id);
      if (result) {
        return result;
      }
    } else if (Array.isArray(val)) {
      for (const child of val) {
        if (isNode(child)) {
          const result = findNodeById(child, id);
          if (result) {
            return result;
          }
        }
      }
    }
  }
};

// TODO: make this a more general function and then create a wrapper for it
// TODO: create a version of this that doesn't mutate things
// TODO: use Semantic.util.traverse, once it's non-mutating
export const replaceNodeWithId = (
  root: Semantic.types.Node,
  id: number,
  replacement: Semantic.types.Node,
): void => {
  for (const [key, val] of Object.entries(root)) {
    if (key === 'loc') {
      continue;
    }
    if (isNode(val)) {
      if (val.id === id) {
        // @ts-expect-error: key is a string so using it as an indexer here is unsafe
        root[key] = replacement;
      } else {
        replaceNodeWithId(val, id, replacement);
      }
    } else if (Array.isArray(val)) {
      for (const [index, child] of val.entries()) {
        if (isNode(child)) {
          if (child.id === id) {
            val[index] = replacement;
          } else {
            replaceNodeWithId(child, id, replacement);
          }
        }
      }
    }
  }
};

/**
 * Returns true if all every element in as is equivalent to an element in bs
 * and vice versa.
 */
export const equality = (
  as: readonly Semantic.types.Node[],
  bs: readonly Semantic.types.Node[],
  context: Context,
): boolean => {
  const { checker } = context;

  // TODO: figure out a way to return steps from this check if there are any.
  return as.every((a) => bs.some((b) => checker.checkStep(a, b, context)));
};

export const correctResult = (
  prev: Semantic.types.Node,
  next: Semantic.types.Node,
  reversed: boolean,
  beforeSteps: readonly Solver.Step[],
  afterSteps: readonly Solver.Step[],
  forwardMessage: string,
  reverseMessage: string = forwardMessage,
): Result => {
  const newPrev = beforeSteps
    ? reversed
      ? Solver.applySteps(
          prev,
          beforeSteps.map((step) => {
            return {
              ...step,
              // The order of the nodes needs to be reversed when
              // operating in a reversed context.
              before: step.after,
              after: step.before,
            };
          }),
        )
      : Solver.applySteps(prev, beforeSteps)
    : prev;

  // TODO: figure out why afterSteps.reverse() and beforeSteps.reverse()
  // breaks a number of our tests.

  // if (reversed) {
  //     afterSteps.reverse();
  //     beforeSteps.reverse();
  // }

  return {
    steps: reversed
      ? [
          ...afterSteps,
          {
            message: reverseMessage,
            before: next,
            after: newPrev,
            substeps: [],
          },
          ...beforeSteps,
        ]
      : [
          ...beforeSteps,
          {
            message: forwardMessage,
            before: newPrev,
            after: next,
            substeps: [],
          },
          ...afterSteps,
        ],
  };
};
