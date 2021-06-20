// A = Atom type
// C = Common type
export type Row<A, C> = C & {
    type: "row";
    children: readonly Node<A, C>[];
};

export type Delimited<A, C> = C & {
    type: "delimited";
    children: readonly [Row<A, C>];
    // How do we limit what can be used as a delimiter?s
    leftDelim: Atom<A, C>;
    rightDelim: Atom<A, C>;
};

export type Table<A, C> = C & {
    type: "table";
    children: readonly (Row<A, C> | null)[];
    rowCount: number;
    colCount: number;
    gutterWidth?: number;
    // How do we limit what can be used as a delimiter?s
    delimiters?: {
        left: Atom<A, C>;
        right: Atom<A, C>;
    };
};

export type SubSup<A, C> = C & {
    type: "subsup";
    children: readonly [Row<A, C> | null, Row<A, C> | null]; // subscript, superscript
};

export type Limits<A, C> = C & {
    type: "limits";
    inner: Node<A, C>;
    children: readonly [Row<A, C>, Row<A, C> | null]; // lower, upper
};

export type Frac<A, C> = C & {
    type: "frac";
    children: readonly [Row<A, C>, Row<A, C>]; // numerator, denominator
};

export type Root<A, C> = C & {
    type: "root";
    children: readonly [Row<A, C> | null, Row<A, C>]; // index, radicand
};

export type Atom<A, C> = C & {
    type: "atom";
    value: A;
};

export type Node<A, C> =
    | Row<A, C>
    | Delimited<A, C>
    | Table<A, C>
    | SubSup<A, C>
    | Limits<A, C>
    | Frac<A, C>
    | Root<A, C>
    | Atom<A, C>;
