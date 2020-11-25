/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import {getId} from "@math-blocks/core";
import {ParsingTypes} from "@math-blocks/semantic";

export const identifier = (
    name: string,
    loc?: ParsingTypes.Location,
): ParsingTypes.Ident => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <T extends string>(
    value: T,
    loc?: ParsingTypes.Location,
): ParsingTypes.Num => ({
    type: "number",
    id: getId(),
    // @ts-ignore: $FIXME
    value: value.replace(/-/g, "\u2212"),
    loc,
});

export const ellipsis = (
    loc?: ParsingTypes.Location,
): ParsingTypes.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    args: TwoOrMore<ParsingTypes.Expression>,
    loc?: ParsingTypes.Location,
): ParsingTypes.Add => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = (
    args: TwoOrMore<ParsingTypes.Expression>,
    implicit = false,
    loc?: ParsingTypes.Location,
): ParsingTypes.Mul => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
    loc,
});

export const eq = (
    args: TwoOrMore<ParsingTypes.Expression>,
    loc?: ParsingTypes.Location,
): ParsingTypes.Eq => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = (
    arg: ParsingTypes.Expression,
    subtraction = false,
    loc?: ParsingTypes.Location,
): ParsingTypes.Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
    loc,
});

export const div = (
    num: ParsingTypes.Expression,
    den: ParsingTypes.Expression,
    loc?: ParsingTypes.Location,
): ParsingTypes.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const exp = (
    base: ParsingTypes.Expression,
    exp: ParsingTypes.Expression,
    loc?: ParsingTypes.Location,
): ParsingTypes.Exp => ({
    type: "exp",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: ParsingTypes.Expression,
    index?: ParsingTypes.Expression,
    loc?: ParsingTypes.Location,
): ParsingTypes.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
    loc,
});

export const isSubtraction = (
    node: ParsingTypes.Expression,
): node is ParsingTypes.Neg => node.type === "neg" && node.subtraction;

export const isNegative = (
    node: ParsingTypes.Expression,
): node is ParsingTypes.Neg => node.type === "neg" && !node.subtraction;

export const getFactors = (
    node: ParsingTypes.Expression,
): OneOrMore<ParsingTypes.Expression> =>
    node.type === "mul" ? node.args : [node];

export const getTerms = (
    node: ParsingTypes.Expression,
): OneOrMore<ParsingTypes.Expression> =>
    node.type === "add" ? node.args : [node];

export const mulFactors = (
    factors: ParsingTypes.Expression[],
    implicit = false,
    loc?: ParsingTypes.Location,
): ParsingTypes.Expression => {
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
                args: factors as TwoOrMore<ParsingTypes.Expression>,
                loc,
            };
    }
};

export const addTerms = (
    terms: ParsingTypes.Expression[],
    loc?: ParsingTypes.Location,
): ParsingTypes.Expression => {
    switch (terms.length) {
        case 0:
            return number("0", loc);
        case 1:
            return terms[0]; // TODO: figure out if we should give this node a location
        default:
            return {
                type: "add",
                id: getId(),
                args: terms as TwoOrMore<ParsingTypes.Expression>,
                loc,
            };
    }
};

// TODO: create a function to check if an answer is simplified or not
export const isNumber = (node: ParsingTypes.Expression): boolean => {
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
