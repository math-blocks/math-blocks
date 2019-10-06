// @flow
/**
 * AST describing semantic expression of mathematic expressions.
 */

// TODO: figure out how to type this properly in flow
type TwoOrMore<T> = Array<T>;

export type Number = {
    type: "number",
    value: string,
    // TODO: unit
    // without 'unit', the number is considered dimensionless
};

export type Infinity = {
    type: "infinity",
};

export type Pi = {
    type: "pi",
};

export type Identifier = {
    type: "identifier",
    name: string,
    // TODO: unit
    // it's possible that variables could have units associated with them as well
    // it seems like a bit of an edge case though

    subscript?: Expression,
};

export type Ellipsis = {
    type: "ellipsis",
};

export type Add = {
    type: "add",
    args: TwoOrMore<Expression>,
};

export type Mul = {
    type: "mul",
    implicit: boolean,
    args: TwoOrMore<Expression>,
};

export type Func = {
    type: "func",
    // We want to limit this to identifiers and expression of identifiers
    // e.g. h(x) = (f + g)(x) = f(x) + g(x) = ...
    func: Expression,
    // There's a special case when each of the args is a variable then it could be a variable definition
    args: Expression[],
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

export type Div = {
    type: "div",
    dividend: Expression,
    divisor: Expression,
};

export type Mod = {
    type: "mod",
    dividend: Expression,
    divisor: Expression,
};

export type Root = {
    type: "root",
    index: Expression,
    radicand: Expression,
};

export type Exp = {
    type: "exp",
    base: Expression,
    exp: Expression,
};

export type Log = {
    type: "log",
    base: Expression,
    arg: Expression,
};

export type Neg = {
    type: "neg",
    subtraction: boolean,
    arg: Expression,
};

export type Abs = {
    type: "abs",
    arg: Expression,
};

// TODO: think about how to define other types of bounds, e.g. sets
export type Limits = {
    type: "limits",
    lower: Expression,
    upper: Expression,
};

export type Sum = {
    type: "sum",
    arg: Expression,
    bvar: Identifier,
    limits: Limits,
};

export type Prod = {
    type: "prod",
    arg: Expression,
    bvar: Identifier,
    limits: Limits,
};

export type Limit = {
    type: "limit",
    side: "left" | "right" | "both",
    bvar: Identifier,
    // TODOO: add target
    arg: Expression,
};

// TODO: think about partial derivatives
export type Diff = {
    type: "diff",
    arg: Expression,
    degree: Expression,

    // If there's a bvar we use liebniz notation, if not
    // we use prime notation.
    bvar?: Identifier,
};

// TODO: think about multiple integrals
export type Int = {
    type: "int",
    arg: Expression,
    bvar: Identifier,
    limits: Limits,
};

// TODO
// - Complex numbers
// - Round, Ceil, Floor, etc.

export type NumericExpression =
    // numbers
    | Number
    | Infinity
    | Pi
    | Identifier
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

export type Eq = {
    type: "eq",
    args: TwoOrMore<Expression>,
};

export type Neq = {
    type: "neq",
    args: TwoOrMore<Expression>,
};

export type Lt = {
    type: "lt",
    args: TwoOrMore<Expression>,
};

export type Lte = {
    type: "lte",
    args: TwoOrMore<Expression>,
};

export type Gt = {
    type: "gt",
    args: TwoOrMore<Expression>,
};

export type Gte = {
    type: "gte",
    args: TwoOrMore<Expression>,
};

export type And = {
    type: "and",
    args: TwoOrMore<Expression>,
};

export type Or = {
    type: "or",
    args: TwoOrMore<Expression>,
};

export type Xor = {
    type: "xor",
    args: TwoOrMore<Expression>,
};

export type Not = {
    type: "not",
    arg: Expression,
};

export type Implies = {
    type: "implies",
    args: [Expression, Expression],
};

export type Iff = {
    type: "iff",
    args: [Expression, Expression],
};

export type True = {
    type: "true",
};

export type False = {
    type: "false",
};

export type Subset = {
    type: "subset",
    args: TwoOrMore<Expression>,
};

export type ProperSubset = {
    type: "prsubset",
    args: TwoOrMore<Expression>,
};

export type NotSubset = {
    type: "notsubset",
    args: TwoOrMore<Expression>,
};

export type NotProperSubset = {
    type: "notprsubset",
    args: TwoOrMore<Expression>,
};

export type In = {
    type: "in",
    element: Identifier,
    set: Expression,
};

export type NotIn = {
    type: "notin",
    element: Identifier,
    set: Expression,
};

export type LogicExpression =
    | Identifier

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

export type Set = {
    type: "set",
    elements: TwoOrMore<Expression>, // could also include shapes, strings, images, etc.
};

export type EmptySet = {
    type: "empty",
};

export type Union = {
    type: "union",
    args: TwoOrMore<Expression>,
};

export type Intersection = {
    type: "intersection",
    args: TwoOrMore<Expression>,
};

export type SetDiff = {
    type: "setdiff",
    args: [Expression, Expression],
};

export type CartesianProduct = {
    type: "cartesianproduct",
    args: TwoOrMore<Expression>,
};

export type Naturals = {
    type: "naturals",
};

export type Integers = {
    type: "integers",
};

export type Rationals = {
    type: "rationals",
};

export type Reals = {
    type: "reals",
};

export type Complexes = {
    type: "complexes",
};

export type SetExpression =
    | Set
    | EmptySet

    // set operations
    | Union
    | Intersection
    | SetDiff
    | CartesianProduct

    // number sets
    | Naturals
    | Integers
    | Rationals
    | Reals
    | Complexes;

export type Expression = NumericExpression | LogicExpression | SetExpression;

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
