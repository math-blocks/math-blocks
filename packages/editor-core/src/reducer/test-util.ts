import * as Semantic from "@math-blocks/semantic";

import * as types from "../ast/types";
import * as builders from "../ast/builders";

import type {ZRow, Zipper, State} from "./types";

export const row = (str: string): types.CharRow =>
    builders.row(
        str.split("").map((glyph) => {
            if (glyph === "-") {
                return builders.glyph("\u2212");
            }
            return builders.glyph(glyph);
        }),
    );

export const frac = (num: string, den: string): types.Frac =>
    builders.frac(
        num.split("").map((glyph) => builders.glyph(glyph)),
        den.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sqrt = (radicand: string): types.Root =>
    builders.root(
        null,
        radicand.split("").map((glyph) => builders.glyph(glyph)),
    );

export const root = (index: string | null, radicand: string): types.Root =>
    builders.root(
        index ? index.split("").map((glyph) => builders.glyph(glyph)) : null,
        radicand.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sup = (sup: string): types.SubSup =>
    builders.subsup(
        undefined,
        sup.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sub = (sub: string): types.SubSup =>
    builders.subsup(
        sub.split("").map((glyph) => builders.glyph(glyph)),
        undefined,
    );

export const subsup = (sub: string | null, sup: string | null): types.SubSup =>
    builders.subsup(
        sub ? sub.split("").map((glyph) => builders.glyph(glyph)) : undefined,
        sup ? sup.split("").map((glyph) => builders.glyph(glyph)) : undefined,
    );

export const delimited = (children: string): types.Delimited =>
    builders.delimited(
        children.split("").map((glyph) => builders.glyph(glyph)),
        builders.glyph("("),
        builders.glyph(")"),
    );

export const toEqualEditorNodes = (
    received: readonly types.CharNode[],
    actual: readonly types.CharNode[],
): {readonly message: () => string; readonly pass: boolean} => {
    const message = "Editor nodes didn't match";
    if (Semantic.util.deepEquals(received, actual)) {
        return {
            message: () => message,
            pass: true,
        };
    }
    return {
        message: () => message,
        pass: false,
    };
};

export const zrow = (
    left: readonly types.CharNode[],
    right: readonly types.CharNode[],
): ZRow => {
    return {
        id: 0,
        type: "zrow",
        left: left,
        selection: [],
        right: right,
        style: {},
    };
};

export const stateFromZipper = (zipper: Zipper): State => {
    if (zipper.row.selection.length > 0) {
        const startZipper = {
            ...zipper,
            row: {
                ...zipper.row,
                selection: [],
                right: [...zipper.row.selection, ...zipper.row.right],
            },
        };
        const endZipper = {
            ...zipper,
            row: {
                ...zipper.row,
                left: [...zipper.row.left, ...zipper.row.selection],
                selection: [],
            },
        };
        return {
            startZipper,
            endZipper,
            zipper,
            selecting: true,
        };
    } else {
        return {
            startZipper: zipper,
            endZipper: zipper,
            zipper,
            selecting: false,
        };
    }
};
