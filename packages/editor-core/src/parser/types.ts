// TODO: dedupe with parser-factory and semantic
export type SourceLocation = {
    readonly path: readonly number[];
    readonly start: number;
    readonly end: number;
};

import * as sharedTypes from "../shared-types";

// TODO: dedupe with lexer.ts
export type Token =
    | {readonly kind: "identifier"; readonly name: string}
    | {readonly kind: "number"; readonly value: string}
    | {readonly kind: "plus"}
    | {readonly kind: "minus"}
    | {readonly kind: "plusminus"}
    | {readonly kind: "times"}
    | {readonly kind: "eq"}
    | {readonly kind: "lt"}
    | {readonly kind: "gt"}
    | {readonly kind: "lparens"}
    | {readonly kind: "rparens"}
    | {readonly kind: "ellipsis"}
    | {readonly kind: "sum"}
    | {readonly kind: "prod"}
    | {readonly kind: "lim"}
    | {readonly kind: "eol"};

type Common = {readonly loc: SourceLocation};

export type Row = sharedTypes.Row<Token, Common>;
export type Delimited = sharedTypes.Delimited<Token, Common>;
export type Table = sharedTypes.Table<Token, Common>;
export type SubSup = sharedTypes.SubSup<Token, Common>;
export type Limits = sharedTypes.Limits<Token, Common>;
export type Frac = sharedTypes.Frac<Token, Common>;
export type Root = sharedTypes.Root<Token, Common>;
export type Atom = sharedTypes.Atom<Token, Common>;

export type Node =
    | Row
    | Delimited
    | Table
    | SubSup
    | Limits
    | Frac
    | Root
    | Atom;
