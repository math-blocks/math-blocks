/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import {getId} from "@math-blocks/core";

import * as Semantic from "./semantic";
import {Location} from "./types";
import {Expression} from "./semantic";

export const identifier = (name: string, loc?: Location): Semantic.Ident => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <T extends string>(
    value: T,
    loc?: Location,
): Semantic.Num<T> => ({
    type: "number",
    id: getId(),
    // @ts-ignore: $FIXME
    value: value.replace(/-/g, "\u2212"),
    loc,
});

export const ellipsis = (loc?: Location): Semantic.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    args: TwoOrMore<Expression>,
    loc?: Location,
): Semantic.Add => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = (
    args: TwoOrMore<Expression>,
    implicit = false,
    loc?: Location,
): Semantic.Mul => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
    loc,
});

export const eq = (
    args: TwoOrMore<Expression>,
    loc?: Location,
): Semantic.Eq => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = (
    arg: Expression,
    subtraction = false,
    loc?: Location,
): Semantic.Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
    loc,
});

export const div = (
    num: Expression,
    den: Expression,
    loc?: Location,
): Semantic.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const exp = (
    base: Expression,
    exp: Expression,
    loc?: Location,
): Semantic.Exp => ({
    type: "exp",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: Expression,
    index?: Expression,
    loc?: Location,
): Semantic.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
    loc,
});

export const isSubtraction = (node: Expression): node is Semantic.Neg =>
    node.type === "neg" && node.subtraction;

export const isNegative = (node: Expression): node is Semantic.Neg =>
    node.type === "neg" && !node.subtraction;

export const getFactors = (node: Expression): OneOrMore<Expression> =>
    node.type === "mul" ? node.args : [node];

export const getTerms = (node: Expression): OneOrMore<Expression> =>
    node.type === "add" ? node.args : [node];

export const mulFactors = (
    factors: Expression[],
    implicit = false,
    loc?: Location,
): Semantic.Expression => {
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
                args: factors as TwoOrMore<Semantic.Expression>,
                loc,
            };
    }
};

export const addTerms = (
    terms: Array<Expression>,
    loc?: Location,
): Semantic.Expression => {
    switch (terms.length) {
        case 0:
            return number("0", loc);
        case 1:
            return terms[0]; // TODO: figure out if we should give this node a location
        default:
            return {
                type: "add",
                id: getId(),
                args: terms as TwoOrMore<Expression>,
                loc,
            };
    }
};

// TODO: create a function to check if an answer is simplified or not
export const isNumber = (node: Expression): boolean => {
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
    } else if (node.type === "exp") {
        return isNumber(node.base) && isNumber(node.exp);
    } else {
        return false;
    }
};
