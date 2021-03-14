import {getId} from "@math-blocks/core";

import * as types from "./types";

export function row(children: readonly types.Node[]): types.Row {
    return {
        id: getId(),
        type: "row",
        children,
    };
}

export function subsup(sub?: types.Node[], sup?: types.Node[]): types.SubSup {
    return {
        id: getId(),
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
    };
}

export function limits(
    inner: types.Node,
    lower: types.Node[],
    upper?: types.Node[],
): types.Limits {
    return {
        id: getId(),
        type: "limits",
        inner,
        children: [row(lower), upper ? row(upper) : null],
    };
}

export function frac(
    numerator: readonly types.Node[],
    denominator: readonly types.Node[],
): types.Frac {
    return {
        id: getId(),
        type: "frac",
        children: [row(numerator), row(denominator)],
    };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root(
    index: types.Node[] | null,
    radicand: types.Node[],
): types.Root {
    return {
        id: getId(),
        type: "root",
        children: [index ? row(index) : null, row(radicand)],
    };
}

export function atom(value: types.Glyph): types.Atom {
    return {
        id: getId(),
        type: "atom",
        value,
    };
}

export const glyph = (char: string, pending?: boolean): types.Atom =>
    atom({kind: "glyph", char, pending});
