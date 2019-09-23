// @flow
/**
 * AST describing semantic expression of mathematic expressions.
 */

// TODO: figure out how to type this properly in flow
type TwoOrMore<T> = Array<T>;

export type Number = {
    kind: "number",
    value: string,
    // TODO: unit
    // without 'unit', the number is considered dimensionless
};

export type Infinity = {
    kind: "infinity",
};

export type Pi = {
    kind: "pi",
};

export type Identifier = {
    kind: "identifier",
    name: string,
    // TODO: unit
    // it's possible that variables could have units associated with them as well
    // it seems like a bit of an edge case though

    subscript?: NumericExpression,
};

export type Ellipsis = {
    kind: "ellipsis",
};

export type Add = {
    kind: "add",
    args: TwoOrMore<NumericExpression>,
};

export type Mul = {
    kind: "mul",
    implicit: boolean,
    args: TwoOrMore<NumericExpression>,
};

export type Func = {
    kind: "func",
    // We want to limit this to identifiers and expression of identifiers
    // e.g. h(x) = (f + g)(x) = f(x) + g(x) = ...
    func: NumericExpression | LogicExpression,
    // There's a special case when each of the args is a variable then it could be a variable definition
    args: (NumericExpression | LogicExpression)[],
};

// I'm not sure how useful having a special node for this is given we'll have
// a separate table for looking up the value of variables, constants, and other
// things that can be defined include functions
// type FuncDef = {
//     kind: "funcdef",
//     func: NumericExpression | LogicExpression,
//     bvars: Identifier[],
//     value: NumericExpression,
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
    kind: "div",
    dividend: NumericExpression,
    divisor: NumericExpression,
};

export type Mod = {
    kind: "mod",
    dividend: NumericExpression,
    divisor: NumericExpression,
};

export type Root = {
    kind: "root",
    index: NumericExpression,
    radicand: NumericExpression,
};

export type Exp = {
    kind: "exp",
    base: NumericExpression,
    exp: NumericExpression,
};

export type Log = {
    kind: "log",
    base: NumericExpression,
    arg: NumericExpression,
};

export type Neg = {
    kind: "neg",
    subtraction: boolean,
    arg: NumericExpression,
};

export type Abs = {
    kind: "abs",
    arg: NumericExpression,
};

// TODO: think about how to define other types of bounds, e.g. sets
export type Limits = {
    kind: "limits",
    lower: NumericExpression,
    upper: NumericExpression,
};

export type Sum = {
    kind: "sum",
    arg: NumericExpression,
    bvar: Identifier,
    limits: Limits,
};

export type Prod = {
    kind: "prod",
    arg: NumericExpression,
    bvar: Identifier,
    limits: Limits,
};

export type Limit = {
    kind: "limit",
    side: "left" | "right" | "both",
    bvar: Identifier,
    // TODOO: add target
    arg: NumericExpression,
};

// TODO: think about partial derivatives
export type Diff = {
    kind: "diff",
    arg: NumericExpression,
    degree: NumericExpression,

    // If there's a bvar we use liebniz notation, if not
    // we use prime notation.
    bvar?: Identifier,
};

// TODO: think about multiple integrals
export type Int = {
    kind: "int",
    arg: NumericExpression,
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
    kind: "eq",
    args: TwoOrMore<NumericExpression>,
};

export type Neq = {
    kind: "neq",
    args: TwoOrMore<NumericExpression>,
};

export type Lt = {
    kind: "lt",
    args: TwoOrMore<NumericExpression>,
};

export type Lte = {
    kind: "lte",
    args: TwoOrMore<NumericExpression>,
};

export type Gt = {
    kind: "gt",
    args: TwoOrMore<NumericExpression>,
};

export type Gte = {
    kind: "gte",
    args: TwoOrMore<NumericExpression>,
};

export type And = {
    kind: "and",
    args: TwoOrMore<LogicExpression>,
};

export type Or = {
    kind: "or",
    args: TwoOrMore<LogicExpression>,
};

export type Xor = {
    kind: "xor",
    args: TwoOrMore<LogicExpression>,
};

export type Not = {
    kind: "not",
    arg: LogicExpression,
};

export type Implies = {
    kind: "implies",
    args: [LogicExpression, LogicExpression],
};

export type Iff = {
    kind: "iff",
    args: [LogicExpression, LogicExpression],
};

export type True = {
    kind: "true",
};

export type False = {
    kind: "false",
};

export type Subset = {
    kind: "subset",
    args: TwoOrMore<SetExpression>,
};

export type ProperSubset = {
    kind: "prsubset",
    args: TwoOrMore<SetExpression>,
};

export type NotSubset = {
    kind: "notsubset",
    args: TwoOrMore<SetExpression>,
};

export type NotProperSubset = {
    kind: "notprsubset",
    args: TwoOrMore<SetExpression>,
};

export type In = {
    kind: "in",
    element: Identifier,
    set: SetExpression,
};

export type NotIn = {
    kind: "notin",
    element: Identifier,
    set: SetExpression,
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

    // relations, result in a LogicExpression which may be evaluated to True or False
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
//     kind: "univ",
//     bvar: Identifier,
//     arg: LogicExpression,
// };

// type Existential = {
//     kind: "exist",
//     bvar: Identifier,
//     arg: LogicExpression,
// };

// type Predicate = {
// };

export type Set = {
    kind: "set",
    elements: TwoOrMore<Expression>, // could also include shapes, strings, images, etc.
};

export type EmptySet = {
    kind: "empty",
};

export type Union = {
    kind: "union",
    args: TwoOrMore<SetExpression>,
};

export type Intersection = {
    kind: "intersection",
    args: TwoOrMore<SetExpression>,
};

export type SetDiff = {
    kind: "setdiff",
    args: [SetExpression, SetExpression],
};

export type CartesianProduct = {
    kind: "cartesianproduct",
    args: TwoOrMore<SetExpression>,
};

export type Naturals = {
    kind: "naturals",
};

export type Integers = {
    kind: "integers",
};

export type Rationals = {
    kind: "rationals",
};

export type Reals = {
    kind: "reals",
};

export type Complexes = {
    kind: "complexes",
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
