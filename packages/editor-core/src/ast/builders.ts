import {getId} from "@math-blocks/core";

import * as types from "./types";

export function row(children: readonly types.CharNode[]): types.CharRow {
    return {
        id: getId(),
        type: "row",
        children,
        style: {},
    };
}

export function subsup(
    sub?: readonly types.CharNode[],
    sup?: readonly types.CharNode[],
): types.SubSup {
    return {
        id: getId(),
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
        style: {},
    };
}

export function limits(
    inner: types.CharNode,
    lower: readonly types.CharNode[],
    upper?: readonly types.CharNode[],
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
    numerator: readonly types.CharNode[],
    denominator: readonly types.CharNode[],
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
    index: readonly types.CharNode[] | null,
    radicand: readonly types.CharNode[],
): types.Root {
    return {
        id: getId(),
        type: "root",
        children: [index ? row(index) : null, row(radicand)],
        style: {},
    };
}

export function delimited(
    inner: readonly types.CharNode[],
    leftDelim: types.CharAtom,
    rightDelim: types.CharAtom,
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
    cells: readonly (readonly types.CharNode[] | null)[],
    colCount: number,
    rowCount: number,
    delimiters?: {
        readonly left: types.CharAtom;
        readonly right: types.CharAtom;
    },
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
    };
}

export function algebra(
    cells: readonly (readonly types.CharNode[] | null)[],
    colCount: number,
    rowCount: number,
): types.Table {
    return table("algebra", cells, colCount, rowCount, undefined);
}

export function matrix(
    cells: readonly (readonly types.CharNode[] | null)[],
    colCount: number,
    rowCount: number,
    delimiters?: {
        readonly left: types.CharAtom;
        readonly right: types.CharAtom;
    },
): types.Table {
    return table("matrix", cells, colCount, rowCount, delimiters);
}

export function atom(value: types.Char): types.CharAtom {
    return {
        id: getId(),
        type: "atom",
        value,
        style: {},
    };
}

export const glyph = (char: string, pending?: boolean): types.CharAtom =>
    atom({kind: "char", char, pending});
