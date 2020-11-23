export type Location = {
    path: number[];
    start: number;
    end: number;
};

export type Token =
    | {kind: "identifier"; name: string}
    | {kind: "number"; value: string}
    | {kind: "plus"}
    | {kind: "minus"}
    | {kind: "times"}
    | {kind: "eq"}
    | {kind: "lparens"}
    | {kind: "rparens"}
    | {kind: "ellipsis"}
    | {kind: "sum"}
    | {kind: "prod"}
    | {kind: "lim"}
    | {kind: "eol"};

export type Row = {
    type: "row";
    children: OneOrMore<Node>;
    loc: Location;
};

export type SubSup = {
    type: "subsup";
    children: [Row | null, Row | null]; // sub, sup
    loc: Location;
};

export type Limits = {
    type: "limits";
    inner: Node;
    children: [Row, Row | null];
    loc: Location;
};

export type Frac = {
    type: "frac";
    children: [Row, Row]; // numerator, denominator
    loc: Location;
};

export type Root = {
    type: "root";
    children: [Row, Row | null];
    loc: Location;
};

export type Atom = {
    type: "atom";
    value: Token;
    loc: Location;
};

export type Node = Row | SubSup | Limits | Frac | Root | Atom;
