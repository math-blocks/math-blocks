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

export enum TokenKind {
    Identifier = "identifier",
    Number = "number",
    Plus = "plus",
    Minus = "minus",
    PlusMinus = "plusmins",
    Times = "times",
    Equal = "equal",
    LessThan = "lt",
    GreaterThan = "gt",
    LeftParens = "lparens", // TODO: rename to OpenParens
    RightParens = "rparens", // TODO: rename to ClosedParens
    Ellipsis = "ellipsis",
    Sum = "sum", // TODO: rename to Summation or Sigma
    Prod = "prod", // TODO: rename to Product
    Lim = "lim",
    EOL = "eol",
}

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
type LT = {readonly type: "token"; readonly name: "lt"};
type GT = {readonly type: "token"; readonly name: "gt"};
type LParens = {readonly type: "token"; readonly name: "lparens"};
type RParens = {readonly type: "token"; readonly name: "rparens"};
type Ellipsis = {readonly type: "token"; readonly name: "ellipsis"};
type Sum = {readonly type: "token"; readonly name: "sum"}; // TODO: change this to SummationOperator
type Prod = {readonly type: "token"; readonly name: "prod"}; // TODO: change this ProductOperator
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
    | LT
    | GT
    | LParens
    | RParens
    | Ellipsis
    | Sum
    | Prod
    | Lim
    | EOL;

type Common = {readonly loc: SourceLocation};

export type TokenRow = sharedTypes.Row<Token, Common>;
export type TokenDelimited = sharedTypes.Delimited<Token, Common>;
export type TokenTable = sharedTypes.Table<Token, Common>;
export type TokenSubSup = sharedTypes.SubSup<Token, Common>;
export type TokenLimits = sharedTypes.Limits<Token, Common>;
export type TokenFrac = sharedTypes.Frac<Token, Common>;
export type TokenRoot = sharedTypes.Root<Token, Common>;
export type TokenAtom = sharedTypes.Atom<Token, Common>;

export type TokenNode =
    | TokenRow
    | TokenDelimited
    | TokenTable
    | TokenSubSup
    | TokenLimits
    | TokenFrac
    | TokenRoot
    | TokenAtom;
