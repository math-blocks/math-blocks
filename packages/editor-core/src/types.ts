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

export type Cursor = {
    path: number[];
    // these are indices of the node inside the parent
    prev: number;
    next: number;
};
