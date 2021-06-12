// TODO: dedupe with parser-factory and semantic
export type SourceLocation = {
    path: readonly number[];
    start: number;
    end: number;
};

import * as sharedTypes from "../shared-types";

// TODO: dedupe with lexer.ts
export type Token =
    | {kind: "identifier"; name: string}
    | {kind: "number"; value: string}
    | {kind: "plus"}
    | {kind: "minus"}
    | {kind: "plusminus"}
    | {kind: "times"}
    | {kind: "eq"}
    | {kind: "lparens"}
    | {kind: "rparens"}
    | {kind: "ellipsis"}
    | {kind: "sum"}
    | {kind: "prod"}
    | {kind: "lim"}
    | {kind: "eol"};

type Common = {loc: SourceLocation};

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
