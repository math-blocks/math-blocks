/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import {getId} from "@math-blocks/core";

import * as ParserTypes from "./types";

export const identifier = (
    name: string,
    loc?: ParserTypes.Location,
): ParserTypes.Ident => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <T extends string>(
    value: T,
    loc?: ParserTypes.Location,
): ParserTypes.Num => ({
    type: "number",
    id: getId(),
    value: value.replace(/-/g, "\u2212"),
    loc,
});

export const ellipsis = (loc?: ParserTypes.Location): ParserTypes.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    args: TwoOrMore<ParserTypes.Expression>,
    loc?: ParserTypes.Location,
): ParserTypes.Add => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = (
    args: TwoOrMore<ParserTypes.Expression>,
    implicit = false,
    loc?: ParserTypes.Location,
): ParserTypes.Mul => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
    loc,
});

export const eq = (
    args: TwoOrMore<ParserTypes.Expression>,
    loc?: ParserTypes.Location,
): ParserTypes.Eq => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = (
    arg: ParserTypes.Expression,
    subtraction = false,
    loc?: ParserTypes.Location,
): ParserTypes.Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
    loc,
});

export const div = (
    num: ParserTypes.Expression,
    den: ParserTypes.Expression,
    loc?: ParserTypes.Location,
): ParserTypes.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const exp = (
    base: ParserTypes.Expression,
    exp: ParserTypes.Expression,
    loc?: ParserTypes.Location,
): ParserTypes.Exp => ({
    type: "exp",
    id: getId(),
    base,
    exp,
    loc,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: ParserTypes.Expression,
    index?: ParserTypes.Expression,
    loc?: ParserTypes.Location,
): ParserTypes.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
    loc,
});
