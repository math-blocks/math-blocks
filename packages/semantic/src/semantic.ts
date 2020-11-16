/**
 * AST describing semantic expression of mathematic expressions.
 */
type Node<Loc> = {
    id: number;
    loc: Loc;
};

export type Num<Loc, Value extends string = string> = Node<Loc> & {
    type: "number";
    value: Value;
    // TODO: unit
    // without 'unit', the number is considered dimensionless
};

export type Infinity<Loc> = Node<Loc> & {
    type: "infinity";
};

export type Pi<Loc> = Node<Loc> & {
    type: "pi";
};

export type Ident<Loc> = Node<Loc> & {
    type: "identifier";
    name: string;
    // TODO: unit
    // it's possible that variables could have units associated with them as well
    // it seems like a bit of an edge case though

    subscript?: Expression<Loc | undefined>;
};

export type Ellipsis<Loc> = Node<Loc> & {
    type: "ellipsis";
};

export type Add<Loc> = Node<Loc> & {
    type: "add";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Mul<Loc> = Node<Loc> & {
    type: "mul";
    implicit: boolean;
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Func<Loc> = Node<Loc> & {
    type: "func";
    // We want to limit this to identifiers and expression of identifiers
    // e.g. h(x) = (f + g)(x) = f(x) + g(x) = ...
    func: Expression<Loc | undefined>;
    // There's a special case when each of the args is a variable then it could be a variable definition
    args: Expression<Loc | undefined>[];
};

// I'm not sure how useful having a special node for this is given we'll have
// a separate table for looking up the value of variables, constants, and other
// things that can be defined include functions
// type FuncDef = {
//     type: "funcdef",
//     func: Expression<Loc> | Expression<Loc>,
//     bvars: Identifier[],
//     value: Expression<Loc>,
// }

// f(x, y) = 2x + y
// criteria:
// - each arg to the function must be an identifier
// - must be part of an equation
// - rhs must be something that can be evaluated so f(x, y) = 2x + y - z would
//   only count if z's value was previously defined
// given a statement like this we can derive a deeper semantic meaning
// from the separate parts

export type Div<Loc> = Node<Loc> & {
    type: "div";
    args: [Expression<Loc | undefined>, Expression<Loc | undefined>];
};

export type Mod<Loc> = Node<Loc> & {
    type: "mod";
    args: [Expression<Loc | undefined>, Expression<Loc | undefined>];
};

export type Root<Loc> = Node<Loc> & {
    type: "root";
    radicand: Expression<Loc | undefined>;
    index: Expression<Loc | undefined>;
};

export type Exp<Loc> = Node<Loc> & {
    type: "exp";
    base: Expression<Loc | undefined>;
    exp: Expression<Loc | undefined>;
};

export type Log<Loc> = Node<Loc> & {
    type: "log";
    base: Expression<Loc | undefined>;
    arg: Expression<Loc | undefined>;
};

export type Neg<Loc> = Node<Loc> & {
    type: "neg";
    subtraction: boolean;
    arg: Expression<Loc | undefined>;
};

export type Abs<Loc> = Node<Loc> & {
    type: "abs";
    arg: Expression<Loc | undefined>;
};

// TODO: think about how to define other types of bounds, e.g. sets
export type Limits<Loc> = Node<Loc> & {
    type: "limits";
    args: [Expression<Loc>, Expression<Loc>]; // lower, upper
};

export type Sum<Loc> = Node<Loc> & {
    type: "sum";
    arg: Expression<Loc | undefined>;
    bvar: Ident<Loc | undefined>;
    limits: Limits<Loc | undefined>;
};

export type Prod<Loc> = Node<Loc> & {
    type: "prod";
    arg: Expression<Loc | undefined>;
    bvar: Ident<Loc | undefined>;
    limits: Limits<Loc | undefined>;
};

export type Limit<Loc> = Node<Loc> & {
    type: "lim";
    // side: "left" | "right" | "both";
    bvar: Ident<Loc | undefined>;
    target: Expression<Loc | undefined>;
    value: Expression<Loc | undefined>;
};

export type Diff<Loc> = Node<Loc> & {
    type: "diff";
    // TODO: figure out how to handle degrees
    args: [Expression<Loc | undefined>]; // arg
};

export type PDiff<Loc> = Node<Loc> & {
    type: "pdiff";
    args: [Expression<Loc | undefined>, Expression<Loc | undefined>]; // numerator, denominator
};

// TODO: think about multiple integrals
export type Int<Loc> = Node<Loc> & {
    type: "int";
    arg: Expression<Loc | undefined>;
    bvar: Ident<Loc | undefined>;
    limits: Limits<Loc | undefined>;
};

// TODO
// - Complex numbers
// - Round, Ceil, Floor, etc.

export type NumericExpression<Loc> =  // numbers
    | Num<Loc>
    | Infinity<Loc>
    | Pi<Loc>
    | Ident<Loc>
    | Ellipsis<Loc>

    // n-ary
    | Add<Loc>
    | Mul<Loc>
    | Func<Loc>

    // binary
    | Div<Loc>
    | Mod<Loc>
    | Root<Loc>
    | Exp<Loc>
    | Log<Loc>

    // unary
    | Neg<Loc>
    | Abs<Loc>
    | Sum<Loc>
    | Prod<Loc>
    | Limit<Loc>
    | Diff<Loc>
    | Int<Loc>;

export type Eq<Loc> = Node<Loc> & {
    type: "eq";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Neq<Loc> = Node<Loc> & {
    type: "neq";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Lt<Loc> = Node<Loc> & {
    type: "lt";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Lte<Loc> = Node<Loc> & {
    type: "lte";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Gt<Loc> = Node<Loc> & {
    type: "gt";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Gte<Loc> = Node<Loc> & {
    type: "gte";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type And<Loc> = Node<Loc> & {
    type: "and";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Or<Loc> = Node<Loc> & {
    type: "or";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Xor<Loc> = Node<Loc> & {
    type: "xor";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type Not<Loc> = Node<Loc> & {
    type: "not";
    args: [Expression<Loc | undefined>];
};

export type Implies<Loc> = Node<Loc> & {
    type: "implies";
    args: [Expression<Loc | undefined>, Expression<Loc | undefined>];
};

export type Iff<Loc> = Node<Loc> & {
    type: "iff";
    args: [Expression<Loc | undefined>, Expression<Loc | undefined>];
};

export type True<Loc> = Node<Loc> & {
    type: "true";
};

export type False<Loc> = Node<Loc> & {
    type: "false";
};

export type Subset<Loc> = Node<Loc> & {
    type: "subset";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type ProperSubset<Loc> = Node<Loc> & {
    type: "prsubset";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type NotSubset<Loc> = Node<Loc> & {
    type: "notsubset";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type NotProperSubset<Loc> = Node<Loc> & {
    type: "notprsubset";
    args: TwoOrMore<Expression<Loc | undefined>>;
};

export type In<Loc> = Node<Loc> & {
    type: "in";
    element: Expression<Loc | undefined>;
    set: Expression<Loc | undefined>; // identifier or set
};

export type NotIn<Loc> = Node<Loc> & {
    type: "notin";
    element: Expression<Loc | undefined>;
    set: Expression<Loc | undefined>; // identifier or set
};

export type LogicExpression<Loc> =
    | Ident<Loc>

    // values
    | True<Loc>
    | False<Loc>

    // operations
    | And<Loc>
    | Or<Loc>
    | Not<Loc>
    | Xor<Loc>
    | Implies<Loc>
    | Iff<Loc>

    // relations, result in a Expression<Loc> which may be evaluated to True or False
    | Eq<Loc>
    | Neq<Loc>
    | Lt<Loc>
    | Lte<Loc>
    | Gt<Loc>
    | Gte<Loc>

    // set relations
    | In<Loc>
    | NotIn<Loc>
    | Subset<Loc>
    | ProperSubset<Loc>
    | NotSubset<Loc>
    | NotProperSubset<Loc>;

// TODO: Predicate Logic

// type Universal = {
//     type: "univ",
//     bvar: Identifier,
//     arg: Expression<Loc>,
// };

// type Existential = {
//     type: "exist",
//     bvar: Identifier,
//     arg: Expression<Loc>,
// };

// type Predicate = {
// };

// TODO: handle things like { x^2 | x ∈ ℕ } and stuff like that
export type Set<Loc> = Node<Loc> & {
    type: "set";
    args: Expression<Loc>[]; // could also include shapes, strings, images, etc.
};

export type EmptySet<Loc> = Node<Loc> & {
    type: "empty";
};

export type Union<Loc> = Node<Loc> & {
    type: "union";
    args: TwoOrMore<Expression<Loc>>;
};

export type Intersection<Loc> = Node<Loc> & {
    type: "intersection";
    args: TwoOrMore<Expression<Loc>>;
};

export type SetDiff<Loc> = Node<Loc> & {
    type: "setdiff";
    args: [Expression<Loc>, Expression<Loc>];
};

export type CartesianProduct<Loc> = Node<Loc> & {
    type: "cartesianproduct";
    args: TwoOrMore<Expression<Loc>>;
};

export type Naturals<Loc> = Node<Loc> & {
    type: "naturals";
};

export type Integers<Loc> = Node<Loc> & {
    type: "integers";
};

export type Rationals<Loc> = Node<Loc> & {
    type: "rationals";
};

export type Reals<Loc> = Node<Loc> & {
    type: "reals";
};

export type Complexes<Loc> = Node<Loc> & {
    type: "complexes";
};

export type SetExpression<Loc> =
    | Set<Loc>

    // set operations
    | EmptySet<Loc>
    | Union<Loc>
    | Intersection<Loc>
    | SetDiff<Loc>

    // number sets
    | CartesianProduct<Loc>
    | Naturals<Loc>
    | Integers<Loc>
    | Rationals<Loc>
    | Reals<Loc>
    | Complexes<Loc>;

export type Expression<Loc> =
    | NumericExpression<Loc>
    | LogicExpression<Loc>
    | SetExpression<Loc>;

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
