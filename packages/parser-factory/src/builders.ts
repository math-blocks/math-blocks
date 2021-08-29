/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import {getId} from "@math-blocks/core";

import * as types from "./types";

export const identifier = (
    name: string,
    loc?: types.SourceLocation,
): types.Ident => ({
    type: "identifier",
    id: getId(),
    name,
    loc,
});

export const number = <T extends string>(
    value: T,
    loc?: types.SourceLocation,
): types.Num => ({
    type: "number",
    id: getId(),
    value: value.replace(/-/g, "\u2212"),
    loc,
});

export const ellipsis = (loc?: types.SourceLocation): types.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
    loc,
});

export const add = (
    args: TwoOrMore<types.Node>,
    loc?: types.SourceLocation,
): types.Add => ({
    type: "add",
    id: getId(),
    args,
    loc,
});

export const mul = (
    args: TwoOrMore<types.Node>,
    implicit = false,
    loc?: types.SourceLocation,
): types.Mul => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
    loc,
});

export const eq = (
    args: TwoOrMore<types.Node>,
    loc?: types.SourceLocation,
): types.Eq => ({
    type: "eq",
    id: getId(),
    args,
    loc,
});

export const neg = (
    arg: types.Node,
    subtraction = false,
    loc?: types.SourceLocation,
): types.Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
    loc,
});

export const plusminus = (
    arg: types.Node,
    arity: "unary" | "binary",
    loc?: types.SourceLocation,
): types.PlusMinus => ({
    type: "plusminus",
    id: getId(),
    arg,
    arity,
    loc,
});

export const div = (
    num: types.Node,
    den: types.Node,
    loc?: types.SourceLocation,
): types.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
    loc,
});

export const pow = (
    base: types.Node,
    exp: types.Node,
    loc?: types.SourceLocation,
): types.Pow => ({
    type: "pow",
    id: getId(),
    base,
    exp,
    loc,
});

export const root = (
    radicand: types.Node,
    index: types.Node,
    loc?: types.SourceLocation,
): types.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index,
    sqrt: false,
    loc,
});

export const sqrt = (
    radicand: types.Node,
    loc?: types.SourceLocation,
): types.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: number("2"),
    sqrt: true,
    loc,
});

export const parens = (
    arg: types.Node,
    loc?: types.SourceLocation,
): types.Parens => ({
    type: "Parens",
    id: getId(),
    arg,
    loc,
});
