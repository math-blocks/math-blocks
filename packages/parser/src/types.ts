/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Expression = NumericExpression | LogicExpression | SetExpression;
export type NumericExpression =
    | Num
    | Infinity
    | Pi
    | Ident
    | Ellipsis
    | Add
    | Mul
    | Func
    | Div
    | Mod
    | Root
    | Exp
    | Log
    | Neg
    | Abs
    | Sum
    | Prod
    | Limit
    | Diff
    | PDiff
    | Int;
export type Num = Node & {
    type: "number";
    value: string;
    [k: string]: unknown;
};
export type Infinity = Node & {
    type: "infinity";
    [k: string]: unknown;
};
export type Pi = Node & {
    type: "pi";
    [k: string]: unknown;
};
export type Ident = Node & {
    type: "identifier";
    name: string;
    subscript?: Expression;
    [k: string]: unknown;
};
export type Ellipsis = Node & {
    type: "ellipsis";
    [k: string]: unknown;
};
export type Add = Node & {
    type: "add";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Mul = Node & {
    type: "mul";
    args: [Expression, Expression, ...Expression[]];
    implicit: boolean;
    [k: string]: unknown;
};
export type Func = Node & {
    type: "func";
    func: Expression;
    args: Expression[];
    [k: string]: unknown;
};
export type Div = Node & {
    type: "div";
    args: [Expression, Expression];
    [k: string]: unknown;
};
export type Mod = Node & {
    type: "mod";
    args: [Expression, Expression];
    [k: string]: unknown;
};
export type Root = Node & {
    type: "root";
    radicand: Expression;
    index: Expression;
    [k: string]: unknown;
};
export type Exp = Node & {
    type: "exp";
    base: Expression;
    exp: Expression;
    [k: string]: unknown;
};
export type Log = Node & {
    type: "log";
    base: Expression;
    arg: Expression;
    [k: string]: unknown;
};
export type Neg = Node & {
    type: "neg";
    arg: Expression;
    subtraction: boolean;
    [k: string]: unknown;
};
export type Abs = Node & {
    type: "abs";
    arg: Expression;
    [k: string]: unknown;
};
export type Sum = Node & {
    type: "sum";
    arg: Expression;
    bvar: Ident;
    limits: Limits;
    [k: string]: unknown;
};
export type Limits = Node & {
    type: "limits";
    args: [Expression, Expression];
    [k: string]: unknown;
};
export type Prod = Node & {
    type: "prod";
    arg: Expression;
    bvar: Ident;
    limits: Limits;
    [k: string]: unknown;
};
export type Limit = Node & {
    type: "lim";
    arg: Expression;
    bvar: Ident;
    target: Expression;
    [k: string]: unknown;
};
export type Diff = Node & {
    type: "diff";
    arg: Expression;
    [k: string]: unknown;
};
export type PDiff = Node & {
    type: "pdiff";
    args: [Expression, Expression];
    [k: string]: unknown;
};
export type Int = Node & {
    type: "int";
    arg: Expression;
    bvar: Ident;
    limits: Ident;
    [k: string]: unknown;
};
export type LogicExpression =
    | Ident
    | True
    | False
    | And
    | Or
    | Not
    | Xor
    | Implies
    | Iff
    | Eq
    | Neq
    | Lt
    | Lte
    | Gt
    | Gte
    | In
    | NotIn
    | Subset
    | ProperSubset
    | NotSubset
    | NotProperSubset;
export type True = Node & {
    type: "true";
    [k: string]: unknown;
};
export type False = Node & {
    type: "false";
    [k: string]: unknown;
};
export type And = Node & {
    type: "and";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Or = Node & {
    type: "or";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Not = Node & {
    type: "not";
    arg: Expression;
    [k: string]: unknown;
};
export type Xor = Node & {
    type: "xor";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Implies = Node & {
    type: "implies";
    args: [Expression, Expression];
    [k: string]: unknown;
};
export type Iff = Node & {
    type: "iff";
    args: [Expression, Expression];
    [k: string]: unknown;
};
export type Eq = Node & {
    type: "eq";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Neq = Node & {
    type: "neq";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Lt = Node & {
    type: "lt";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Lte = Node & {
    type: "lte";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Gt = Node & {
    type: "gt";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Gte = Node & {
    type: "gte";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type In = Node & {
    type: "in";
    element: Expression;
    set: Expression;
    [k: string]: unknown;
};
export type NotIn = Node & {
    type: "notin";
    element: Expression;
    set: Expression;
    [k: string]: unknown;
};
export type Subset = Node & {
    type: "subset";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type ProperSubset = Node & {
    type: "prsubset";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type NotSubset = Node & {
    type: "notsubset";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type NotProperSubset = Node & {
    type: "notprsubset";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type SetExpression =
    | Ident
    | Set
    | EmptySet
    | Union
    | Intersection
    | SetDiff
    | CartesianProduct
    | Naturals
    | Integers
    | Rationals
    | Reals
    | Complexes;
export type Set = Node & {
    type: "set";
    args: Expression[];
    [k: string]: unknown;
};
export type EmptySet = Node & {
    type: "empty";
    [k: string]: unknown;
};
export type Union = Node & {
    type: "union";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Intersection = Node & {
    type: "intersection";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type SetDiff = Node & {
    type: "setdiff";
    args: [Expression, Expression];
    [k: string]: unknown;
};
export type CartesianProduct = Node & {
    type: "cartesian_product";
    args: [Expression, Expression, ...Expression[]];
    [k: string]: unknown;
};
export type Naturals = Node & {
    type: "naturals";
    [k: string]: unknown;
};
export type Integers = Node & {
    type: "integers";
    [k: string]: unknown;
};
export type Rationals = Node & {
    type: "rationals";
    [k: string]: unknown;
};
export type Reals = Node & {
    type: "reals";
    [k: string]: unknown;
};
export type Complexes = Node & {
    type: "complexes";
    [k: string]: unknown;
};

export interface Node {
    id: number;
    loc?: Location;
    [k: string]: unknown;
}
export interface Location {
    path: number[];
    start: number;
    end: number;
    [k: string]: unknown;
}
