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
): types.CharSubSup {
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
): types.CharLimits {
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
): types.CharFrac {
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
): types.CharRoot {
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
): types.CharDelimited {
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
): types.CharTable {
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
): types.CharTable {
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
): types.CharTable {
    return table("matrix", cells, colCount, rowCount, delimiters);
}

export function atom(value: types.Char): types.CharAtom {
    return {
        ...value,
        id: getId(),
        style: {},
    };
}

export const char = (char: string, pending?: boolean): types.CharAtom =>
    atom({type: "char", value: char, pending});
