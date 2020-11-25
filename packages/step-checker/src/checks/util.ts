import produce from "immer";

import * as Semantic from "@math-blocks/semantic";
import {ValidationTypes} from "@math-blocks/semantic";

import {Status} from "../enums";
import {Step, HasArgs, Context, Result} from "../types";

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

export const zip = <A, B>(a: A[], b: B[]): [A, B][] => {
    const result: [A, B][] = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        result.push([a[i], b[i]]);
    }
    return result;
};

export const decomposeFactors = (
    factors: ValidationTypes.NumericExpression[],
): ValidationTypes.NumericExpression[] => {
    return factors.reduce(
        (result: ValidationTypes.NumericExpression[], factor) => {
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
        },
        [],
    );
};

const isNode = (val: unknown): val is ValidationTypes.Expression => {
    return Object.prototype.hasOwnProperty.call(val, "type");
};

export const findNodeById = (
    root: ValidationTypes.Expression,
    id: number,
): ValidationTypes.Expression | void => {
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
export const replaceNodeWithId = (
    root: ValidationTypes.Expression,
    id: number,
    replacement: ValidationTypes.Expression,
): void => {
    for (const [key, val] of Object.entries(root)) {
        if (key === "loc") {
            continue;
        }
        if (isNode(val)) {
            if (val.id === id) {
                // @ts-ignore
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
    root: ValidationTypes.Expression,
    steps: Step[],
): ValidationTypes.Expression => {
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

const isObject = (val: unknown): val is Record<string, unknown> => {
    return typeof val === "object" && val != null;
};

export const deepEquals = (a: unknown, b: unknown): boolean => {
    if (Array.isArray(a) && Array.isArray(b)) {
        return (
            a.length === b.length &&
            a.every((val, index) => deepEquals(val, b[index]))
        );
    } else if (isObject(a) && isObject(b)) {
        const aKeys = Object.keys(a).filter(
            (key) => key !== "id" && key !== "loc",
        );
        const bKeys = Object.keys(b).filter(
            (key) => key !== "id" && key !== "loc",
        );
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        return aKeys.every(
            (key) =>
                Object.prototype.hasOwnProperty.call(b, key) &&
                deepEquals(a[key], b[key]),
        );
    } else {
        return a === b;
    }
};

export const hasArgs = (a: ValidationTypes.Expression): a is HasArgs =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte" ||
    a.type === "div";

/**
 * Returns all of the elements that appear in both as and bs.
 */
export const intersection = <T>(as: T[], bs: T[]): T[] => {
    const result: T[] = [];
    for (const a of as) {
        // We use deepEquals here as an optimization.  If there are equivalent
        // nodes that aren't exactly the same between the as and bs then one of
        // out other checks will find it.
        const index = bs.findIndex((b) => deepEquals(a, b));
        if (index !== -1) {
            result.push(a);
            bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
        }
    }
    return result;
};

/**
 * Returns all of the elements that appear in as but not in bs.
 */
export const difference = <T>(as: T[], bs: T[]): T[] => {
    const result: T[] = [];
    for (const a of as) {
        // We use deepEquals here as an optimization.  If there are equivalent
        // nodes that aren't exactly the same between the as and bs then one of
        // out other checks will find it.
        const index = bs.findIndex((b) => deepEquals(a, b));
        if (index !== -1) {
            bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
        } else {
            result.push(a);
        }
    }
    return result;
};

/**
 * Returns true if all every element in as is equivalent to an element in bs
 * and vice versa.
 */
export const equality = (
    as: ValidationTypes.Expression[],
    bs: ValidationTypes.Expression[],
    context: Context,
): boolean => {
    const {checker} = context;

    // TODO: figure out a way to return steps from this check if there are any.
    return as.every((a) => bs.some((b) => checker.checkStep(a, b, context)));
};

export const correctResult = (
    prev: ValidationTypes.Expression,
    next: ValidationTypes.Expression,
    reversed: boolean,
    beforeSteps: Step[],
    afterSteps: Step[],
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
    prev: ValidationTypes.Expression,
    next: ValidationTypes.Expression,
    reversed: boolean,
    beforeSteps: Step[],
    afterSteps: Step[],
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
