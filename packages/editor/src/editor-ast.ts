import {getId} from "@math-blocks/core";

export type Glyph = {
    kind: "glyph";
    char: string;
    pending?: boolean;
};

export type Row = {
    type: "row";
    children: Node[];
    id: number;
};

// TODO: collapse SubSup, Frac, and Root since they're very similar
export type SubSup = {
    type: "subsup";
    children: [Row | null, Row | null]; // sub, sup
    id: number;
};

export type Limits = {
    type: "limits";
    inner: Node;
    children: [Row, Row | null];
    id: number;
};

export type Frac = {
    type: "frac";
    children: [Row, Row]; // numerator, denominator
    id: number;
};

export type Root = {
    type: "root";
    children: [Row, Row | null]; // radicand, index
    id: number;
};

export type Atom = {
    type: "atom";
    value: Glyph;
    id: number;
};

export type Node = Row | SubSup | Limits | Frac | Root | Atom;

// The editor nodes need IDs so we can position the cursor relative to
// layout nodes which get their ID from the editor nodes.

export type HasChildren = Row;

export function row(children: Node[]): Row {
    return {
        id: getId(),
        type: "row",
        children,
    };
}

export function subsup(sub?: Node[], sup?: Node[]): SubSup {
    return {
        id: getId(),
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
    };
}

export function limits(inner: Node, lower: Node[], upper?: Node[]): Limits {
    return {
        id: getId(),
        type: "limits",
        inner,
        children: [row(lower), upper ? row(upper) : null],
    };
}

export function frac(numerator: Node[], denominator: Node[]): Frac {
    return {
        id: getId(),
        type: "frac",
        children: [row(numerator), row(denominator)],
    };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root(arg: Node[], index: Node[] | null): Root {
    return {
        id: getId(),
        type: "root",
        children: [row(arg), index ? row(index) : null],
    };
}

export function atom(value: Glyph): Atom {
    return {
        id: getId(),
        type: "atom",
        value,
    };
}

export const glyph = (char: string, pending?: boolean): Atom =>
    atom({kind: "glyph", char, pending});

export type Cursor = {
    path: number[];
    // these are indices of the node inside the parent
    prev: number;
    next: number;
};
