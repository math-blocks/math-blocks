import produce from "immer";

import * as Semantic from "@math-blocks/semantic";

import {Status} from "../enums";
import {Step, Context, Result} from "../types";

// TODO: handle negative numbers
export const primeDecomp = (n: number): number[] => {
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
    factors: readonly Semantic.Types.NumericNode[],
): readonly Semantic.Types.NumericNode[] => {
    return factors.reduce((result: Semantic.Types.NumericNode[], factor) => {
        // TODO: add decomposition of powers
        if (factor.type === "number") {
            return [
                ...result,
                ...primeDecomp(parseInt(factor.value)).map((value) =>
                    Semantic.number(String(value)),
                ),
            ];
        } else {
            return [...result, factor];
        }
    }, []);
};

const isNode = (val: unknown): val is Semantic.Types.Node => {
    return Object.prototype.hasOwnProperty.call(val, "type");
};

export const findNodeById = (
    root: Semantic.Types.Node,
    id: number,
): Semantic.Types.Node | void => {
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
// TODO: create a version of this that doesn't mutate things for when we're not
// using immer
export const replaceNodeWithId = (
    root: Semantic.Types.Node,
    id: number,
    replacement: Semantic.Types.Node,
): void => {
    for (const [key, val] of Object.entries(root)) {
        if (key === "loc") {
            continue;
        }
        if (isNode(val)) {
            if (val.id === id) {
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

export const applySteps = (
    root: Semantic.Types.Node,
    steps: readonly Step[],
): Semantic.Types.Node => {
    const nextState = produce(root, (draft) => {
        // We need to apply each step
        for (const step of steps) {
            // Not all reasons come with nodes yet.
            if (step.nodes.length === 2) {
                replaceNodeWithId(draft, step.nodes[0].id, step.nodes[1]);
            }
        }
    });
    return nextState;
};

/**
 * Returns true if all every element in as is equivalent to an element in bs
 * and vice versa.
 */
export const equality = (
    as: readonly Semantic.Types.Node[],
    bs: readonly Semantic.Types.Node[],
    context: Context,
): boolean => {
    const {checker} = context;

    // TODO: figure out a way to return steps from this check if there are any.
    return as.every((a) => bs.some((b) => checker.checkStep(a, b, context)));
};

export const correctResult = (
    prev: Semantic.Types.Node,
    next: Semantic.Types.Node,
    reversed: boolean,
    beforeSteps: readonly Step[],
    afterSteps: readonly Step[],
    forwardMessage: string,
    reverseMessage: string = forwardMessage,
): Result => {
    const newPrev = beforeSteps
        ? reversed
            ? applySteps(
                  prev,
                  beforeSteps.map((step) => {
                      return {
                          ...step,
                          // The order of the nodes needs to be reversed when
                          // operating in a reversed context.
                          nodes: [step.nodes[1], step.nodes[0]],
                      };
                  }),
              )
            : applySteps(prev, beforeSteps)
        : prev;

    // TODO: figure out why afterSteps.reverse() and beforeSteps.reverse()
    // breaks a number of our tests.

    // if (reversed) {
    //     afterSteps.reverse();
    //     beforeSteps.reverse();
    // }

    newPrev; // ?

    return {
        status: Status.Correct,
        steps: reversed
            ? [
                  ...afterSteps,
                  {
                      message: reverseMessage,
                      nodes: [next, newPrev],
                  },
                  ...beforeSteps,
              ]
            : [
                  ...beforeSteps,
                  {
                      message: forwardMessage,
                      nodes: [newPrev, next],
                  },
                  ...afterSteps,
              ],
    };
};

export const incorrectResult = (
    prev: Semantic.Types.Node,
    next: Semantic.Types.Node,
    reversed: boolean,
    beforeSteps: readonly Step[],
    afterSteps: readonly Step[],
    forwardMessage: string,
    reverseMessage: string = forwardMessage,
): Result => {
    const newPrev = beforeSteps
        ? reversed
            ? applySteps(
                  prev,
                  beforeSteps.map((step) => {
                      return {
                          ...step,
                          // The order of the nodes needs to be reversed when
                          // operating in a reversed context.
                          nodes: [step.nodes[1], step.nodes[0]],
                      };
                  }),
              )
            : applySteps(prev, beforeSteps)
        : prev;

    // TODO: figure out why afterSteps.reverse() and beforeSteps.reverse()
    // breaks a number of our tests.

    // if (reversed) {
    //     afterSteps.reverse();
    //     beforeSteps.reverse();
    // }

    return {
        status: Status.Incorrect,
        steps: reversed
            ? [
                  ...afterSteps,
                  {
                      message: reverseMessage,
                      nodes: [next, newPrev],
                  },
                  ...beforeSteps,
              ]
            : [
                  ...beforeSteps,
                  {
                      message: forwardMessage,
                      nodes: [newPrev, next],
                  },
                  ...afterSteps,
              ],
    };
};
