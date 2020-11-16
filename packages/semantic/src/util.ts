/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import * as Semantic from "./semantic";
import {getId} from "@math-blocks/core";

export const identifier = <Loc>(
    name: string,
    loc: Loc,
): Semantic.Ident<Loc> => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <Loc, T extends string = string>(
    value: T,
    loc: Loc,
): Semantic.Num<Loc, T> => ({
    type: "number",
    id: getId(),
    // @ts-ignore: $FIXME
    value: value.replace(/-/g, "\u2212"),
    loc,
});

export const ellipsis = <Loc>(loc: Loc): Semantic.Ellipsis<Loc> => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = <Loc>(
    args: TwoOrMore<Semantic.Expression<Loc>>,
    loc: Loc,
): Semantic.Add<Loc> => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = <Loc>(
    args: TwoOrMore<Semantic.Expression<Loc | undefined>>,
    loc: Loc,
    implicit = false,
): Semantic.Mul<Loc> => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
    loc,
});

export const eq = <Loc>(
    args: TwoOrMore<Semantic.Expression<Loc | undefined>>,
    loc: Loc,
): Semantic.Eq<Loc> => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = <Loc>(
    arg: Semantic.Expression<Loc | undefined>,
    loc: Loc,
    subtraction = false,
): Semantic.Neg<Loc> => ({
    type: "neg",
    id: getId(),
    arg,
    loc,
    subtraction,
});

export const div = <Loc>(
    num: Semantic.Expression<Loc | undefined>,
    den: Semantic.Expression<Loc | undefined>,
    loc: Loc,
): Semantic.Div<Loc> => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const exp = <Loc>(
    base: Semantic.Expression<Loc | undefined>,
    exp: Semantic.Expression<Loc | undefined>,
    loc: Loc,
): Semantic.Exp<Loc> => ({
    type: "exp",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = <Loc>(
    radicand: Semantic.Expression<Loc | undefined>,
    loc: Loc,
    index?: Semantic.Expression<Loc | undefined>,
): Semantic.Root<Loc> => ({
    type: "root",
    id: getId(),
    radicand,
    loc,
    index: index || number("2", undefined),
});

export const isSubtraction = <Loc>(
    node: Semantic.Expression<Loc>,
): node is Semantic.Neg<Loc> => node.type === "neg" && node.subtraction;

export const isNegative = <Loc>(
    node: Semantic.Expression<Loc>,
): node is Semantic.Neg<Loc> => node.type === "neg" && !node.subtraction;

export const getFactors = <Loc>(
    node: Semantic.Expression<Loc>,
): OneOrMore<Semantic.Expression<Loc | undefined>> =>
    node.type === "mul" ? node.args : [node];

export const getTerms = <Loc>(
    node: Semantic.Expression<Loc>,
): OneOrMore<Semantic.Expression<Loc | undefined>> =>
    node.type === "add" ? node.args : [node];

export const mulFactors = <Loc>(
    factors: Semantic.Expression<Loc | undefined>[],
    loc: Loc,
    implicit = false,
): Semantic.Expression<Loc> => {
    switch (factors.length) {
        case 0:
            return number("1", loc);
        case 1:
            return factors[0]; // should we override the location of this node
        default:
            return {
                type: "mul",
                id: getId(),
                implicit,
                args: factors as TwoOrMore<Semantic.Expression<Loc>>,
                loc,
            };
    }
};

export const addTerms = <Loc>(
    terms: Array<Semantic.Expression<Loc | undefined>>,
    loc: Loc,
): Semantic.Expression<Loc> => {
    switch (terms.length) {
        case 0:
            return number("0", loc);
        case 1:
            return terms[0]; // should we override the location of this node
        default:
            return {
                type: "add",
                id: getId(),
                args: terms as TwoOrMore<Semantic.Expression<Loc>>,
                loc,
            };
    }
};

// TODO: create a function to check if an answer is simplified or not
export const isNumber = <Loc>(node: Semantic.Expression<Loc>): boolean => {
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
