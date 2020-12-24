/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import Fraction from "fraction.js";

import {getId} from "@math-blocks/core";

import * as Types from "./types";

// TODO: create a separate file for builders
export const identifier = (
    name: string,
    loc?: Types.Location,
): Types.Ident => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <T extends string>(
    value: T,
    loc?: Types.Location,
): Types.Num | Types.Neg => {
    if (value.startsWith("-")) {
        // TODO: handle location data correctly
        return neg(number(value.slice(1)));
    }
    return {
        type: "number",
        id: getId(),
        value: value.replace(/-/g, "\u2212"),
        loc,
    };
};

export const ellipsis = (loc?: Types.Location): Types.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    args: TwoOrMore<Types.NumericNode>,
    loc?: Types.Location,
): Types.Add => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = (
    args: TwoOrMore<Types.NumericNode>,
    implicit = false,
    loc?: Types.Location,
): Types.Mul => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
    loc,
});

export const eq = (
    args: TwoOrMore<Types.Node>,
    loc?: Types.Location,
): Types.Eq => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = (
    arg: Types.NumericNode,
    subtraction = false,
    loc?: Types.Location,
): Types.Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
    loc,
});

export const div = (
    num: Types.NumericNode,
    den: Types.NumericNode,
    loc?: Types.Location,
): Types.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const pow = (
    base: Types.NumericNode,
    exp: Types.NumericNode,
    loc?: Types.Location,
): Types.Pow => ({
    type: "pow",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: Types.NumericNode,
    index?: Types.NumericNode,
    loc?: Types.Location,
): Types.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
    loc,
});

export const parens = (
    arg: Types.Node,
    loc?: Types.Location,
): Types.Parens => ({
    type: "parens",
    id: getId(),
    arg,
    loc,
});

export const isSubtraction = (node: Types.NumericNode): node is Types.Neg =>
    node.type === "neg" && node.subtraction;

export const isNegative = (node: Types.NumericNode): node is Types.Neg =>
    node.type === "neg" && !node.subtraction;

export const getFactors = (
    node: Types.NumericNode,
): OneOrMore<Types.NumericNode> => (node.type === "mul" ? node.args : [node]);

export const getTerms = (
    node: Types.NumericNode,
): OneOrMore<Types.NumericNode> => (node.type === "add" ? node.args : [node]);

export const mulFactors = (
    factors: Types.NumericNode[],
    implicit = false,
    loc?: Types.Location,
): Types.NumericNode => {
    switch (factors.length) {
        case 0:
            return number("1", loc);
        case 1:
            return factors[0]; // TODO: figure out if we should give this node a location
        default:
            return {
                type: "mul",
                id: getId(),
                implicit,
                args: factors as TwoOrMore<Types.NumericNode>,
                loc,
            };
    }
};

export const addTerms = (
    terms: Types.NumericNode[],
    loc?: Types.Location,
): Types.NumericNode => {
    switch (terms.length) {
        case 0:
            return number("0", loc);
        case 1:
            return terms[0]; // TODO: figure out if we should give this node a location
        default:
            return {
                type: "add",
                id: getId(),
                args: terms as TwoOrMore<Types.NumericNode>,
                loc,
            };
    }
};

// TODO: create a function to check if an answer is simplified or not
// TODO: rename this to canBeEvaluated()
export const isNumber = (node: Types.Node): boolean => {
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
export const isNumeric = (node: Types.Node): node is Types.NumericNode => {
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

export type HasArgs =
    | Types.Add
    | Types.Mul
    | Types.Eq
    | Types.Neq
    | Types.Lt
    | Types.Lte
    | Types.Gt
    | Types.Gte
    | Types.Div;

export const hasArgs = (a: Types.Node): a is HasArgs =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte" ||
    a.type === "div";

// TODO: dedup with grader package
type Options = {
    skipEvalChecker?: boolean;
    evalFractions?: boolean;
};

// TODO: create a wrapper around this that returns a Semantic.Types.NumericNode
// Right now we don't handle returning fractions in a lot of places.
export const evalNode = (
    node: Types.Node,
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
