import {getId} from "@math-blocks/core";

import * as types from "./types";

export const identifier = (
    name: string,
    loc?: types.Location,
): types.Ident => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <T extends string>(
    value: T,
    loc?: types.Location,
): types.Num | types.Neg => {
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

export const ellipsis = (loc?: types.Location): types.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    terms: readonly types.NumericNode[],
    loc?: types.Location,
): types.NumericNode => {
    switch (terms.length) {
        case 0:
            return number("0", loc);
        case 1:
            return terms[0]; // TODO: figure out if we should give this node a location
        default:
            return {
                type: "add",
                id: getId(),
                args: terms as TwoOrMore<types.NumericNode>,
                loc,
            };
    }
};

export const mul = (
    factors: readonly types.NumericNode[],
    implicit = false,
    loc?: types.Location,
): types.NumericNode => {
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
                args: factors as TwoOrMore<types.NumericNode>,
                loc,
            };
    }
};

export const eq = (
    args: TwoOrMore<types.Node>,
    loc?: types.Location,
): types.Eq => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = (
    arg: types.NumericNode,
    subtraction = false,
    loc?: types.Location,
): types.Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
    loc,
});

export const div = (
    num: types.NumericNode,
    den: types.NumericNode,
    loc?: types.Location,
): types.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const pow = (
    base: types.NumericNode,
    exp: types.NumericNode,
    loc?: types.Location,
): types.Pow => ({
    type: "pow",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: types.NumericNode,
    index?: types.NumericNode,
    loc?: types.Location,
): types.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
    loc,
});

export const parens = (
    arg: types.Node,
    loc?: types.Location,
): types.Parens => ({
    type: "parens",
    id: getId(),
    arg,
    loc,
});
