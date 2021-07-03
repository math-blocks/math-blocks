import {getId} from "@math-blocks/core";

import * as types from "./types";

export function row(children: readonly types.Node[]): types.Row {
    return {
        id: getId(),
        type: "row",
        children,
        style: {},
    };
}

export function subsup(
    sub?: readonly types.Node[],
    sup?: readonly types.Node[],
): types.SubSup {
    return {
        id: getId(),
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
        style: {},
    };
}

export function limits(
    inner: types.Node,
    lower: readonly types.Node[],
    upper?: readonly types.Node[],
): types.Limits {
    return {
        id: getId(),
        type: "limits",
        inner,
        children: [row(lower), upper ? row(upper) : null],
        style: {},
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
        style: {},
    };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root(
    index: readonly types.Node[] | null,
    radicand: readonly types.Node[],
): types.Root {
    return {
        id: getId(),
        type: "root",
        children: [index ? row(index) : null, row(radicand)],
        style: {},
    };
}

export function delimited(
    inner: readonly types.Node[],
    leftDelim: types.Atom,
    rightDelim: types.Atom,
): types.Delimited {
    return {
        id: getId(),
        type: "delimited",
        children: [row(inner)],
        leftDelim: leftDelim,
        rightDelim: rightDelim,
        style: {},
    };
}

export function table(
    subtype: "matrix" | "algebra",
    cells: readonly (readonly types.Node[] | null)[],
    colCount: number,
    rowCount: number,
    delimiters?: {
        readonly left: types.Atom;
        readonly right: types.Atom;
    },
    gutterWidth?: number,
): types.Table {
    return {
        id: getId(),
        type: "table",
        subtype,
        children: cells.map((cell) => cell && row(cell)),
        colCount,
        rowCount,
        rowStyles: undefined,
        colStyles: undefined,
        delimiters,
        style: {},
        gutterWidth,
    };
}

export function algebra(
    cells: readonly (readonly types.Node[] | null)[],
    colCount: number,
    rowCount: number,
): types.Table {
    return table("algebra", cells, colCount, rowCount, undefined, 0);
}

export function matrix(
    cells: readonly (readonly types.Node[] | null)[],
    colCount: number,
    rowCount: number,
    delimiters?: {
        readonly left: types.Atom;
        readonly right: types.Atom;
    },
): types.Table {
    return table("matrix", cells, colCount, rowCount, delimiters);
}

export function atom(value: types.Glyph): types.Atom {
    return {
        id: getId(),
        type: "atom",
        value,
        style: {},
    };
}

export const glyph = (char: string, pending?: boolean): types.Atom =>
    atom({kind: "glyph", char, pending});
