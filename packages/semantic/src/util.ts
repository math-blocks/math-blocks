/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import Fraction from "fraction.js";

import * as types from "./types";

export const isSubtraction = (node: types.NumericNode): node is types.Neg =>
    node.type === "neg" && node.subtraction;

export const isNegative = (node: types.NumericNode): node is types.Neg =>
    node.type === "neg" && !node.subtraction;

export const getFactors = (
    node: types.NumericNode,
): OneOrMore<types.NumericNode> => (node.type === "mul" ? node.args : [node]);

export const getTerms = (
    node: types.NumericNode,
): OneOrMore<types.NumericNode> => (node.type === "add" ? node.args : [node]);

// TODO: create a function to check if an answer is simplified or not
// TODO: rename this to canBeEvaluated()
export const isNumber = (node: types.Node): boolean => {
    if (node.type === "number") {
        return true;
    } else if (node.type === "neg") {
        return isNumber(node.arg);
    } else if (node.type === "div") {
        return node.args.every(isNumber);
    } else if (node.type === "mul") {
        return node.args.every(isNumber);
    } else if (node.type === "add") {
        return node.args.every(isNumber);
    } else if (node.type === "root") {
        return isNumber(node.radicand) && isNumber(node.index);
    } else if (node.type === "pow") {
        return isNumber(node.base) && isNumber(node.exp);
    } else {
        return false;
    }
};

// TODO: autogenerate this from the validation schema
export const isNumeric = (node: types.Node): node is types.NumericNode => {
    return [
        "number",
        "identifier",
        "pi",
        "infinity",
        "ellipsis",
        "add",
        "mul",
        "func",
        "div",
        "mod",
        "root",
        "pow",
        "log",
        "neg",
        "abs",
        "sum",
        "prod",
        "limit",
        "diff",
        "pdiff",
        "int",
    ].includes(node.type);
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
            (key) => key !== "id" && key !== "loc" && key !== "source",
        );
        const bKeys = Object.keys(b).filter(
            (key) => key !== "id" && key !== "loc" && key !== "source",
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

/**
 * Returns all of the elements that appear in both as and bs.
 */
export const intersection = <T>(
    as: readonly T[],
    bs: readonly T[],
): readonly T[] => {
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
export const difference = <T>(
    as: readonly T[],
    bs: readonly T[],
): readonly T[] => {
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

export type HasArgs =
    | types.Add
    | types.Mul
    | types.Eq
    | types.Neq
    | types.Lt
    | types.Lte
    | types.Gt
    | types.Gte
    | types.Div;

export const hasArgs = (a: types.Node): a is HasArgs =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte" ||
    a.type === "div";

// TODO: dedupe with grader package
type Options = {
    skipEvalChecker?: boolean;
    evalFractions?: boolean;
};

// TODO: create a wrapper around this that returns a Semantic.Types.NumericNode
// Right now we don't handle returning fractions in a lot of places.
export const evalNode = (
    node: types.Node,
    options: Options = {
        evalFractions: true,
    },
): Fraction => {
    if (node.type === "number") {
        return new Fraction(node.value);
    } else if (node.type === "neg") {
        return evalNode(node.arg, options).mul(new Fraction("-1"));
    } else if (node.type === "div" && options.evalFractions) {
        // TODO: add a recursive option as well
        return evalNode(node.args[0], options).div(
            evalNode(node.args[1], options),
        );
    } else if (node.type === "add") {
        return node.args.reduce(
            (sum, term) => sum.add(evalNode(term, options)),
            new Fraction("0"),
        );
    } else if (node.type === "mul") {
        return node.args.reduce(
            (sum, factor) => sum.mul(evalNode(factor, options)),
            new Fraction("1"),
        );
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};

/**
 * Traverse the nodes in a semantic tree.
 *
 * Traverse supports in place mutation of nodes within the tree.  If an `exit`
 * callback is provided that returns a value, the return value will replace
 * the node that was passed to it.
 */
export const traverse = (
    node: types.Node,
    callbacks: {
        enter?: (node: types.Node) => void;
        exit?: (node: types.Node) => types.Node | void;
    },
): types.Node => {
    if (callbacks.enter) {
        callbacks.enter(node);
    }
    for (const [key, value] of Object.entries(node)) {
        if (Array.isArray(value)) {
            // All arrays in the tree except for Location.path contain nodes.
            // Since we never pass a Location as an arg to traverse we should
            // be okey without doing additional checks.
            // @ts-expect-error: key is typed as string so using it as a key is unsafe
            node[key] = value.map((child) => traverse(child, callbacks));
        } else if (
            typeof value === "object" &&
            value != null &&
            value.hasOwnProperty("type")
        ) {
            // @ts-expect-error: key is typed as string so using it as a key is unsafe
            node[key] = traverse(value as types.Node, callbacks);
        }
    }
    if (callbacks.exit) {
        const result = callbacks.exit(node);
        if (result) {
            return result;
        }
    }
    return node;
};
