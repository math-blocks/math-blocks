import produce from "immer";

import * as Util from "../semantic/util";
import * as Semantic from "../semantic/semantic";

import {Step} from "./types";

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
    factors: Semantic.Expression[],
): Semantic.Expression[] => {
    return factors.reduce((result: Semantic.Expression[], factor) => {
        // TODO: add decomposition of powers
        if (factor.type === "number") {
            return [
                ...result,
                ...primeDecomp(parseInt(factor.value)).map(value =>
                    Util.number(String(value)),
                ),
            ];
        } else {
            return [...result, factor];
        }
    }, []);
};

const isNode = (val: unknown): val is Semantic.Expression => {
    return Object.prototype.hasOwnProperty.call(val, "type");
};

export const findNodeById = (
    root: Semantic.Expression,
    id: number,
): Semantic.Expression | void => {
    if (root.id === id) {
        return root;
    }
    for (const val of Object.values(root)) {
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
    root: Semantic.Expression,
    id: number,
    replacement: Semantic.Expression,
): void => {
    for (const [key, val] of Object.entries(root)) {
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

export const applySubReasons = (
    root: Semantic.Expression,
    subreasons: Step[],
): Semantic.Expression => {
    const nextState = produce(root, draft => {
        for (const reason of subreasons) {
            // Not all reaons come with nodes yet.
            if (reason.nodes.length === 2) {
                replaceNodeWithId(draft, reason.nodes[0].id, reason.nodes[1]);
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
        const aKeys = Object.keys(a).filter(key => key !== "id");
        const bKeys = Object.keys(b).filter(key => key !== "id");
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        return aKeys.every(
            key =>
                Object.prototype.hasOwnProperty.call(b, key) &&
                deepEquals(a[key], b[key]),
        );
    } else {
        return a === b;
    }
};
