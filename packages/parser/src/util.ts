/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import {getId} from "@math-blocks/core";

import * as Types from "./types";

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
): Types.Num => ({
    type: "number",
    id: getId(),
    value: value.replace(/-/g, "\u2212"),
    loc,
});

export const ellipsis = (loc?: Types.Location): Types.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    args: TwoOrMore<Types.Node>,
    loc?: Types.Location,
): Types.Add => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = (
    args: TwoOrMore<Types.Node>,
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
    arg: Types.Node,
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
    num: Types.Node,
    den: Types.Node,
    loc?: Types.Location,
): Types.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const exp = (
    base: Types.Node,
    exp: Types.Node,
    loc?: Types.Location,
): Types.Exp => ({
    type: "exp",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: Types.Node,
    index?: Types.Node,
    loc?: Types.Location,
): Types.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
    loc,
});
