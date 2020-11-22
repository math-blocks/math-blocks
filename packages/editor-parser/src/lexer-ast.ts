import {Location} from "./types";

type Ident = {kind: "identifier"; name: string};
type Num = {kind: "number"; value: string};
type Plus = {kind: "plus"};
type Minus = {kind: "minus"};
type Times = {kind: "times"};
type Equal = {kind: "eq"};
type LParens = {kind: "lparens"};
type RParens = {kind: "rparens"};
type Ellipsis = {kind: "ellipsis"};
type Sum = {kind: "sum"};
type Prod = {kind: "prod"};
type Lim = {kind: "lim"};
type EOL = {kind: "eol"};

export type Token =
    | Ident
    | Num
    | Plus
    | Minus
    | Times
    | Equal
    | LParens
    | RParens
    | Ellipsis
    | Sum
    | Prod
    | Lim
    | EOL;

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
