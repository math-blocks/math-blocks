/**
 * AST describing semantic expression of mathematic expressions.
 */
import {Location} from "./parsing-types";

// This uses a generic parameter so that we can enforce that all of the nodes
// in the tree returned by editor-parser.ts contain location data.
type Node = {id: number; loc?: Location};

export type Num<Value extends string = string> = Node & {
    type: "number";
    value: Value;
    // TODO: unit
    // without 'unit', the number is considered dimensionless
};

export type Infinity = Node & {
    type: "infinity";
};

export type Pi = Node & {
    type: "pi";
};

export type Ident = Node & {
    type: "identifier";
    name: string;
    // TODO: unit
    // it's possible that variables could have units associated with them as well
    // it seems like a bit of an edge case though

    subscript?: Expression;
};

export type Ellipsis = Node & {
    type: "ellipsis";
};

export type Add = Node & {
    type: "add";
    args: TwoOrMore<Expression>;
};

export type Mul = Node & {
    type: "mul";
    implicit: boolean;
    args: TwoOrMore<Expression>;
};

export type Func = Node & {
    type: "func";
    // We want to limit this to identifiers and expression of identifiers
    // e.g. h(x) = (f + g)(x) = f(x) + g(x) = ...
    func: Expression;
    // There's a special case when each of the args is a variable then it could be a variable definition
    args: Expression[];
};

// I'm not sure how useful having a special node for this is given we'll have
// a separate table for looking up the value of variables, constants, and other
// things that can be defined include functions
// type FuncDef = {
//     type: "funcdef",
//     func: Expression | Expression,
//     bvars: Identifier[],
//     value: Expression,
// }

// f(x, y) = 2x + y
// criteria:
// - each arg to the function must be an identifier
// - must be part of an equation
// - rhs must be something that can be evaluated so f(x, y) = 2x + y - z would
//   only count if z's value was previously defined
// given a statement like this we can derive a deeper semantic meaning
// from the separate parts

export type Div = Node & {
    type: "div";
    args: [Expression, Expression];
};

export type Mod = Node & {
    type: "mod";
    args: [Expression, Expression];
};

export type Root = Node & {
    type: "root";
    radicand: Expression;
    index: Expression;
};

export type Exp = Node & {
    type: "exp";
    base: Expression;
    exp: Expression;
};

export type Log = Node & {
    type: "log";
    base: Expression;
    arg: Expression;
};

export type Neg = Node & {
    type: "neg";
    subtraction: boolean;
    arg: Expression;
};

export type Abs = Node & {
    type: "abs";
    arg: Expression;
};

// TODO: think about how to define other types of bounds, e.g. sets
export type Limits = Node & {
    type: "limits";
    args: [Expression, Expression]; // lower, upper
};

export type Sum = Node & {
    type: "sum";
    arg: Expression;
    bvar: Ident;
    limits: Limits;
};

export type Prod = Node & {
    type: "prod";
    arg: Expression;
    bvar: Ident;
    limits: Limits;
};

export type Limit = Node & {
    type: "lim";
    // side: "left" | "right" | "both";
    bvar: Ident;
    target: Expression;
    value: Expression;
};

export type Diff = Node & {
    type: "diff";
    // TODO: figure out how to handle degrees
    args: [Expression]; // arg
};

export type PDiff = Node & {
    type: "pdiff";
    args: [Expression, Expression]; // numerator, denominator
};

// TODO: think about multiple integrals
export type Int = Node & {
    type: "int";
    arg: Expression;
    bvar: Ident;
    limits: Limits;
};

// TODO
// - Complex numbers
// - Round, Ceil, Floor, etc.

export type NumericExpression =  // numbers
    | Num
    | Infinity
    | Pi
    | Ident
    | Ellipsis

    // n-ary
    | Add
    | Mul
    | Func

    // binary
    | Div
    | Mod
    | Root
    | Exp
    | Log

    // unary
    | Neg
    | Abs
    | Sum
    | Prod
    | Limit
    | Diff
    | Int;

export type Eq = Node & {
    type: "eq";
    args: TwoOrMore<Expression>;
};

export type Neq = Node & {
    type: "neq";
    args: TwoOrMore<Expression>;
};

export type Lt = Node & {
    type: "lt";
    args: TwoOrMore<Expression>;
};

export type Lte = Node & {
    type: "lte";
    args: TwoOrMore<Expression>;
};

export type Gt = Node & {
    type: "gt";
    args: TwoOrMore<Expression>;
};

export type Gte = Node & {
    type: "gte";
    args: TwoOrMore<Expression>;
};

export type And = Node & {
    type: "and";
    args: TwoOrMore<Expression>;
};

export type Or = Node & {
    type: "or";
    args: TwoOrMore<Expression>;
};

export type Xor = Node & {
    type: "xor";
    args: TwoOrMore<Expression>;
};

export type Not = Node & {
    type: "not";
    args: [Expression];
};

export type Implies = Node & {
    type: "implies";
    args: [Expression, Expression];
};

export type Iff = Node & {
    type: "iff";
    args: [Expression, Expression];
};

export type True = Node & {
    type: "true";
};

export type False = Node & {
    type: "false";
};

export type Subset = Node & {
    type: "subset";
    args: TwoOrMore<Expression>;
};

export type ProperSubset = Node & {
    type: "prsubset";
    args: TwoOrMore<Expression>;
};

export type NotSubset = Node & {
    type: "notsubset";
    args: TwoOrMore<Expression>;
};

export type NotProperSubset = Node & {
    type: "notprsubset";
    args: TwoOrMore<Expression>;
};

export type In = Node & {
    type: "in";
    element: Expression;
    set: Expression; // identifier or set
};

export type NotIn = Node & {
    type: "notin";
    element: Expression;
    set: Expression; // identifier or set
};

export type LogicExpression =
    | Ident

    // values
    | True
    | False

    // operations
    | And
    | Or
    | Not
    | Xor
    | Implies
    | Iff

    // relations, result in a Expression which may be evaluated to True or False
    | Eq
    | Neq
    | Lt
    | Lte
    | Gt
    | Gte

    // set relations
    | In
    | NotIn
    | Subset
    | ProperSubset
    | NotSubset
    | NotProperSubset;

// TODO: Predicate Logic

// type Universal = {
//     type: "univ",
//     bvar: Identifier,
//     arg: Expression,
// };

// type Existential = {
//     type: "exist",
//     bvar: Identifier,
//     arg: Expression,
// };

// type Predicate = {
// };

// TODO: handle things like { x^2 | x ∈ ℕ } and stuff like that
export type Set = Node & {
    type: "set";
    args: Expression[]; // could also include shapes, strings, images, etc.
};

export type EmptySet = Node & {
    type: "empty";
};

export type Union = Node & {
    type: "union";
    args: TwoOrMore<Expression>;
};

export type Intersection = Node & {
    type: "intersection";
    args: TwoOrMore<Expression>;
};

export type SetDiff = Node & {
    type: "setdiff";
    args: [Expression, Expression];
};

export type CartesianProduct = Node & {
    type: "cartesianproduct";
    args: TwoOrMore<Expression>;
};

export type Naturals = Node & {
    type: "naturals";
};

export type Integers = Node & {
    type: "integers";
};

export type Rationals = Node & {
    type: "rationals";
};

export type Reals = Node & {
    type: "reals";
};

export type Complexes = Node & {
    type: "complexes";
};

export type SetExpression =
    | Set

    // set operations
    | EmptySet
    | Union
    | Intersection
    | SetDiff

    // number sets
    | CartesianProduct
    | Naturals
    | Integers
    | Rationals
    | Reals
    | Complexes;

export type Expression = NumericExpression | LogicExpression | SetExpression;

export type Zero = Num<"0">;
export type One = Num<"1">;

// TODO: vectors and matrices

// TODO: geometry (2D, 3D)
// - Point
// - Line
// - Ray
// - Polygon (Quadrilateral, Trapezoid, Parallelogram, Rhombus, Square, Triangle)
//   - Polygon-type-opedia
// - Circle
// - Ellipse
// - Parallel
// - Perpendicular
// - Congruent, Similiar
// - transforms: Scale, Rotate, Translate, Skew
// TODO: sets

// Evaluation
// - when evaluating, we have to consider the scope of a variable, e.g.
//   the x inside an integral is bound to dx which maps to the start/end
//   of the interval of integration, but there might be a different x
//   outside of the integral with a different value
// - conversely if there's a y in the expression being integrated but
//   there's no dy then y grabs its value from the closest wrapping scope
// - NOTE: scope and binding is yet another thing that isn't explicitly
//   taught in math education but probably should
