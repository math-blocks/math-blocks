// TODO: dedupe with parser-factory and semantic
export type SourceLocation = {
    readonly path: readonly number[];
    readonly start: number;
    readonly end: number;
};

import * as sharedTypes from "../shared-types";

// operations / relations: + - = < <= > >= != sqrt
// symbols: a - z, pi, theta, etc.
// functions: sin, cos, tan, log, lim, etc.

// const funcs = ["sin", "cos", "tan", "log", "lim"];

type Ident = {
    readonly type: "token";
    readonly name: "identifier";
    readonly value: string;
};
type Num = {
    readonly type: "token";
    readonly name: "number";
    readonly value: string;
};
type Plus = {readonly type: "token"; readonly name: "plus"};
type Minus = {readonly type: "token"; readonly name: "minus"};
type PlusMinus = {readonly type: "token"; readonly name: "plusminus"};
type Times = {readonly type: "token"; readonly name: "times"};
type Equal = {readonly type: "token"; readonly name: "eq"};
type LParens = {readonly type: "token"; readonly name: "lparens"};
type RParens = {readonly type: "token"; readonly name: "rparens"};
type Ellipsis = {readonly type: "token"; readonly name: "ellipsis"};
type Sum = {readonly type: "token"; readonly name: "sum"};
type Prod = {readonly type: "token"; readonly name: "prod"};
type Lim = {readonly type: "token"; readonly name: "lim"};
type EOL = {readonly type: "token"; readonly name: "eol"};

export type Token =
    | Ident
    | Num
    | Plus
    | Minus
    | PlusMinus
    | Times
    | Equal
    | LParens
    | RParens
    | Ellipsis
    | Sum
    | Prod
    | Lim
    | EOL;

type Common = {readonly loc: SourceLocation};

export type TokenRow = sharedTypes.Row<Token, Common>;
export type Delimited = sharedTypes.Delimited<Token, Common>;
export type Table = sharedTypes.Table<Token, Common>;
export type SubSup = sharedTypes.SubSup<Token, Common>;
export type Limits = sharedTypes.Limits<Token, Common>;
export type Frac = sharedTypes.Frac<Token, Common>;
export type Root = sharedTypes.Root<Token, Common>;
export type TokenAtom = sharedTypes.Atom<Token, Common>;

export type TokenNode =
    | TokenRow
    | Delimited
    | Table
    | SubSup
    | Limits
    | Frac
    | Root
    | TokenAtom;
