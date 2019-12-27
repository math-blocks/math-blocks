/**
 * AST describing semantic expression of mathematic expressions.
 */

export type Num = {
    readonly type: "number";
    readonly value: string;
    // TODO: unit
    // without 'unit', the number is considered dimensionless
};

export type Infinity = {
    readonly type: "infinity";
};

export type Pi = {
    readonly type: "pi";
};

export type Ident = {
    readonly type: "identifier";
    readonly name: string;
    // TODO: unit
    // it's possible that variables could have units associated with them as well
    // it seems like a bit of an edge case though

    readonly subscript?: Expression;
};

export type Ellipsis = {
    readonly type: "ellipsis";
};

export type Add = {
    readonly type: "add";
    readonly args: TwoOrMore<Expression>;
};

export type Mul = {
    readonly type: "mul";
    readonly implicit: boolean;
    readonly args: TwoOrMore<Expression>;
};

export type Func = {
    readonly type: "func";
    // We want to limit this to identifiers and expression of identifiers
    // e.g. h(x) = (f + g)(x) = f(x) + g(x) = ...
    readonly func: Expression;
    // There's a special case when each of the args is a variable then it could be a variable definition
    readonly args: readonly Expression[];
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
    readonly type: "div";
    readonly args: readonly [Expression, Expression];
};

export type Mod = {
    readonly type: "mod";
    readonly args: readonly [Expression, Expression];
};

export type Root = {
    readonly type: "root";
    readonly args: readonly [
        Expression, // radicand
        Expression,
    ];
    // index: Expression,
    // radicand: Expression,
};

export type Exp = {
    readonly type: "exp";
    readonly args: readonly [Expression, Expression]; // base, exp
};

export type Log = {
    readonly type: "log";
    readonly args: readonly [Expression, Expression]; // base, arg
};

export type Neg = {
    readonly type: "neg";
    readonly subtraction: boolean;
    readonly args: readonly [Expression];
};

export type Abs = {
    readonly type: "abs";
    readonly args: readonly [Expression];
};

// TODO: think about how to define other types of bounds, e.g. sets
export type Limits = {
    readonly type: "limits";
    readonly args: readonly [Expression, Expression]; // lower, upper
};

export type Sum = {
    readonly type: "sum";
    readonly arg: Expression;
    readonly bvar: Ident;
    readonly limits: Limits;
};

export type Prod = {
    readonly type: "prod";
    readonly arg: Expression;
    readonly bvar: Ident;
    readonly limits: Limits;
};

export type Limit = {
    readonly type: "limit";
    readonly side: "left" | "right" | "both";
    readonly bvar: Ident;
    // TODOO: add target
    readonly arg: Expression;
};

// TODO: think about partial derivatives
export type Diff = {
    readonly type: "diff";
    readonly arg: Expression;
    readonly degree: Expression;

    // If there's a bvar we use liebniz notation, if not
    // we use prime notation.
    readonly bvar?: Ident;
};

// TODO: think about multiple integrals
export type Int = {
    readonly type: "int";
    readonly arg: Expression;
    readonly bvar: Ident;
    readonly limits: Limits;
};

// TODO
// - Complex numbers
// - Round, Ceil, Floor, etc.

export type NumericExpression =  // numbers
    | Num
    | Infinity
    | Pi
    | Ident
    | Ellipsis // n-ary
    | Add
    | Mul
    | Func // binary
    | Div
    | Mod
    | Root
    | Exp
    | Log // unary
    | Neg
    | Abs
    | Sum
    | Prod
    | Limit
    | Diff
    | Int;

export type Eq = {
    readonly type: "eq";
    readonly args: TwoOrMore<Expression>;
};

export type Neq = {
    readonly type: "neq";
    readonly args: TwoOrMore<Expression>;
};

export type Lt = {
    readonly type: "lt";
    readonly args: TwoOrMore<Expression>;
};

export type Lte = {
    readonly type: "lte";
    readonly args: TwoOrMore<Expression>;
};

export type Gt = {
    readonly type: "gt";
    readonly args: TwoOrMore<Expression>;
};

export type Gte = {
    readonly type: "gte";
    readonly args: TwoOrMore<Expression>;
};

export type And = {
    readonly type: "and";
    readonly args: TwoOrMore<Expression>;
};

export type Or = {
    readonly type: "or";
    readonly args: TwoOrMore<Expression>;
};

export type Xor = {
    readonly type: "xor";
    readonly args: TwoOrMore<Expression>;
};

export type Not = {
    readonly type: "not";
    readonly args: readonly [Expression];
};

export type Implies = {
    readonly type: "implies";
    readonly args: readonly [Expression, Expression];
};

export type Iff = {
    readonly type: "iff";
    readonly args: readonly [Expression, Expression];
};

export type True = {
    readonly type: "true";
};

export type False = {
    readonly type: "false";
};

export type Subset = {
    readonly type: "subset";
    readonly args: TwoOrMore<Expression>;
};

export type ProperSubset = {
    readonly type: "prsubset";
    readonly args: TwoOrMore<Expression>;
};

export type NotSubset = {
    readonly type: "notsubset";
    readonly args: TwoOrMore<Expression>;
};

export type NotProperSubset = {
    readonly type: "notprsubset";
    readonly args: TwoOrMore<Expression>;
};

export type In = {
    readonly type: "in";
    readonly element: Ident;
    readonly set: Expression;
};

export type NotIn = {
    readonly type: "notin";
    readonly element: Ident;
    readonly set: Expression;
};

export type LogicExpression =
    | Ident // values
    | True
    | False // operations
    | And
    | Or
    | Not
    | Xor
    | Implies
    | Iff // relations, result in a Expression which may be evaluated to True or False
    | Eq
    | Neq
    | Lt
    | Lte
    | Gt
    | Gte // set relations
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
    readonly type: "set";
    readonly elements: TwoOrMore<Expression>; // could also include shapes, strings, images, etc.
};

export type EmptySet = {
    readonly type: "empty";
};

export type Union = {
    readonly type: "union";
    readonly args: TwoOrMore<Expression>;
};

export type Intersection = {
    readonly type: "intersection";
    readonly args: TwoOrMore<Expression>;
};

export type SetDiff = {
    readonly type: "setdiff";
    readonly args: readonly [Expression, Expression];
};

export type CartesianProduct = {
    readonly type: "cartesianproduct";
    readonly args: TwoOrMore<Expression>;
};

export type Naturals = {
    readonly type: "naturals";
};

export type Integers = {
    readonly type: "integers";
};

export type Rationals = {
    readonly type: "rationals";
};

export type Reals = {
    readonly type: "reals";
};

export type Complexes = {
    readonly type: "complexes";
};

export type SetExpression =
    // eslint-disable-next-line functional/prefer-readonly-type
    | Set
    | EmptySet // set operations
    | Union
    | Intersection
    | SetDiff
    | CartesianProduct // number sets
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
