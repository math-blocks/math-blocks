// TODO: dedupe with parser and semantic
export type SourceLocation = {
  readonly path: readonly number[];
  readonly start: number;
  readonly end: number;
};

import * as sharedTypes from '../shared-types';

// operations / relations: + - = < <= > >= != sqrt
// symbols: a - z, pi, theta, etc.
// functions: sin, cos, tan, log, lim, etc.

// const funcs = ["sin", "cos", "tan", "log", "lim"];

export enum TokenKind {
  Identifier = 'Identifier',
  Number = 'Number',
  Plus = 'Plus',
  Minus = 'Minus',
  PlusMinus = 'PlusMinus',
  Times = 'Times',
  Equal = 'Equal',
  LessThan = 'LessThan',
  LessThanOrEqual = 'LessThanOrEqual',
  GreaterThan = 'GreaterThan',
  GreaterThanOrEqual = 'GreaterThanOrEqual',
  LeftParens = 'LeftParens',
  RightParens = 'RightParens',
  Ellipsis = 'Ellipsis',
  SummationOperator = 'SummationOperator',
  ProductOperator = 'ProductOperator',
  Lim = 'Lim',
  EOL = 'EOL',
}

export type ValueToken<kind extends TokenKind> = {
  readonly type: 'token';
  readonly name: kind;
  readonly value: string;
};

export type Identifier = {
  readonly type: 'token';
  readonly name: TokenKind.Identifier;
  readonly value: string;
};
type Number = ValueToken<TokenKind.Number>;

type SimpleToken<kind extends TokenKind> = {
  readonly type: 'token';
  readonly name: kind;
};

type Plus = SimpleToken<TokenKind.Plus>;
type Minus = SimpleToken<TokenKind.Minus>;
type PlusMinus = SimpleToken<TokenKind.PlusMinus>;
type Times = SimpleToken<TokenKind.Times>;
type Equal = SimpleToken<TokenKind.Equal>;
type LessThan = SimpleToken<TokenKind.LessThan>;
type LessThanOrEqual = SimpleToken<TokenKind.LessThanOrEqual>;
type GreaterThan = SimpleToken<TokenKind.GreaterThan>;
type GreaterThanOrEqual = SimpleToken<TokenKind.GreaterThanOrEqual>;
type LeftParens = SimpleToken<TokenKind.LeftParens>;
type RightParens = SimpleToken<TokenKind.RightParens>;
type Ellipsis = SimpleToken<TokenKind.Ellipsis>;
type SummationOperator = SimpleToken<TokenKind.SummationOperator>;
type ProductOperator = SimpleToken<TokenKind.ProductOperator>;
type Lim = SimpleToken<TokenKind.Lim>;
type EOL = SimpleToken<TokenKind.EOL>;

export type Token =
  | Identifier
  | Number // eslint-disable-line @typescript-eslint/ban-types
  | Plus
  | Minus
  | PlusMinus
  | Times
  | Equal
  | LessThan
  | LessThanOrEqual
  | GreaterThan
  | GreaterThanOrEqual
  | LeftParens
  | RightParens
  | Ellipsis
  | SummationOperator
  | ProductOperator
  | Lim
  | EOL;

type Common = { readonly loc: SourceLocation };

export type TokenRow = sharedTypes.Row<Token, Common>;
export type TokenDelimited = sharedTypes.Delimited<Token, Common>;
export type TokenAccent = sharedTypes.Accent<Token, Common>;
export type TokenMacro = sharedTypes.Macro<Token, Common>;
export type TokenTable = sharedTypes.Table<Token, Common>;
export type TokenSubSup = sharedTypes.SubSup<Token, Common>;
export type TokenLimits = sharedTypes.Limits<Token, Common>;
export type TokenFrac = sharedTypes.Frac<Token, Common>;
export type TokenRoot = sharedTypes.Root<Token, Common>;
export type TokenAtom = sharedTypes.Atom<Token, Common>;

export type TokenNode =
  | TokenRow
  | TokenDelimited
  | TokenAccent
  | TokenMacro
  | TokenTable
  | TokenSubSup
  | TokenLimits
  | TokenFrac
  | TokenRoot
  | TokenAtom;
