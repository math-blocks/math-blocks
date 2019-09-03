// @flow
/**
 * AST describing semantic expression of mathematic expressions.
 */

// TODO: figure out how to type this properly in flow
type TwoOrMore<T> = Array<T>;

export type NumberNode = {
    kind: "number",
    value: string,
    // TODO: unit
    // without 'unit', the number is considered dimensionless
};

export type InfinityNode = {
    kind: "infinity",
};

export type PiNode = {
    kind: "pi",
};

export type IdentifierNode = {
    kind: "identifier",
    name: string,
    // TODO: unit
    // it's possible that variables could have units associated with them as well
    // it seems like a bit of an edge case though

    subscript?: NumericExpression,
};

export type EllipsisNode = {
    kind: "ellipsis",
};

export type AddNode = {
    kind: "add",
    args: TwoOrMore<NumericExpression>,
};

export type MulNode = {
    kind: "mul",
    implicit: boolean,
    args: TwoOrMore<NumericExpression>,
};

export type FuncNode = {
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
// type FuncDefNode = {
//     kind: "funcdef",
//     func: NumericExpression | LogicExpression,
//     bvars: IdentifierNode[],
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

export type DivNode = {
    kind: "div",
    dividend: NumericExpression,
    divisor: NumericExpression,
};

export type ModNode = {
    kind: "mod",
    dividend: NumericExpression,
    divisor: NumericExpression,
};

export type RootNode = {
    kind: "root",
    index: NumericExpression,
    radicand: NumericExpression,
};

export type ExpNode = {
    kind: "exp",
    base: NumericExpression,
    exp: NumericExpression,
};

export type LogNode = {
    kind: "log",
    base: NumericExpression,
    arg: NumericExpression,
};

export type NegNode = {
    kind: "neg",
    subtraction: boolean,
    arg: NumericExpression,
};

export type AbsNode = {
    kind: "abs",
    arg: NumericExpression,
};

// TODO: think about how to define other types of bounds, e.g. sets
export type Limits = {
    kind: "limits",
    lower: NumericExpression,
    upper: NumericExpression,
};

export type SumNode = {
    kind: "sum",
    arg: NumericExpression,
    bvar: IdentifierNode,
    limits: Limits,
};

export type ProdNode = {
    kind: "prod",
    arg: NumericExpression,
    bvar: IdentifierNode,
    limits: Limits,
};

export type LimitNode = {
    kind: "limit",
    side: "left" | "right" | "both",
    bvar: IdentifierNode,
    // TODOO: add target
    arg: NumericExpression,
};

// TODO: think about partial derivatives
export type DiffNode = {
    kind: "diff",
    arg: NumericExpression,
    degree: NumericExpression,

    // If there's a bvar we use liebniz notation, if not
    // we use prime notation.
    bvar?: IdentifierNode,
};

// TODO: think about multiple integrals
export type IntNode = {
    kind: "int",
    arg: NumericExpression,
    bvar: IdentifierNode,
    limits: Limits,
};

// TODO
// - Complex numbers
// - Round, Ceil, Floor, etc.

export type NumericExpression =
    // numbers
    | NumberNode
    | InfinityNode
    | PiNode
    | IdentifierNode
    | EllipsisNode

    // n-ary
    | AddNode
    | MulNode
    | FuncNode

    // binary
    | DivNode
    | ModNode
    | RootNode
    | ExpNode
    | LogNode

    // unary
    | NegNode
    | AbsNode
    | SumNode
    | ProdNode
    | LimitNode
    | DiffNode
    | IntNode;

export type EqNode = {
    kind: "eq",
    args: TwoOrMore<NumericExpression>,
};

export type NeqNode = {
    kind: "neq",
    args: TwoOrMore<NumericExpression>,
};

export type LtNode = {
    kind: "lt",
    args: TwoOrMore<NumericExpression>,
};

export type LteNode = {
    kind: "lte",
    args: TwoOrMore<NumericExpression>,
};

export type GtNode = {
    kind: "gt",
    args: TwoOrMore<NumericExpression>,
};

export type GteNode = {
    kind: "gte",
    args: TwoOrMore<NumericExpression>,
};

export type AndNode = {
    kind: "and",
    args: TwoOrMore<LogicExpression>,
};

export type OrNode = {
    kind: "or",
    args: TwoOrMore<LogicExpression>,
};

export type XorNode = {
    kind: "xor",
    args: TwoOrMore<LogicExpression>,
};

export type NotNode = {
    kind: "not",
    arg: LogicExpression,
};

export type ImpliesNode = {
    kind: "implies",
    args: [LogicExpression, LogicExpression],
};

export type IffNode = {
    kind: "iff",
    args: [LogicExpression, LogicExpression],
};

export type TrueNode = {
    kind: "true",
};

export type FalseNode = {
    kind: "false",
};

export type SubsetNode = {
    kind: "subset",
    args: TwoOrMore<SetExpression>,
};

export type ProperSubsetNode = {
    kind: "prsubset",
    args: TwoOrMore<SetExpression>,
};

export type NotSubsetNode = {
    kind: "notsubset",
    args: TwoOrMore<SetExpression>,
};

export type NotProperSubsetNode = {
    kind: "notprsubset",
    args: TwoOrMore<SetExpression>,
};

export type InNode = {
    kind: "in",
    element: IdentifierNode,
    set: SetExpression,
};

export type NotInNode = {
    kind: "notin",
    element: IdentifierNode,
    set: SetExpression,
};

export type LogicExpression =
    | IdentifierNode

    // values
    | TrueNode
    | FalseNode

    // operations
    | AndNode
    | OrNode
    | NotNode
    | XorNode
    | ImpliesNode
    | IffNode

    // relations, result in a LogicExpression which may be evaluated to True or False
    | EqNode
    | NeqNode
    | LtNode
    | LteNode
    | GtNode
    | GteNode

    // set relations
    | InNode
    | NotInNode
    | SubsetNode
    | ProperSubsetNode
    | NotSubsetNode
    | NotProperSubsetNode;

// TODO: Predicate Logic

// type UniversalNode = {
//     kind: "univ",
//     bvar: IdentifierNode,
//     arg: LogicExpression,
// };

// type ExistentialNode = {
//     kind: "exist",
//     bvar: IdentifierNode,
//     arg: LogicExpression,
// };

// type PredicateNode = {
// };

export type SetNode = {
    kind: "set",
    elements: TwoOrMore<Expression>, // could also include shapes, strings, images, etc.
};

export type EmptySetNode = {
    kind: "empty",
};

export type UnionNode = {
    kind: "union",
    args: TwoOrMore<SetExpression>,
};

export type IntersectionNode = {
    kind: "intersection",
    args: TwoOrMore<SetExpression>,
};

export type SetDiffNode = {
    kind: "setdiff",
    args: [SetExpression, SetExpression],
};

export type CartesianProductNode = {
    kind: "cartesianproduct",
    args: TwoOrMore<SetExpression>,
};

export type NaturalsNode = {
    kind: "naturals",
};

export type IntegersNode = {
    kind: "integers",
};

export type RationalsNode = {
    kind: "rationals",
};

export type RealsNode = {
    kind: "reals",
};

export type ComplexesNode = {
    kind: "complexes",
};

export type SetExpression =
    | SetNode
    | EmptySetNode

    // set operations
    | UnionNode
    | IntersectionNode
    | SetDiffNode
    | CartesianProductNode

    // number sets
    | NaturalsNode
    | IntegersNode
    | RationalsNode
    | RealsNode
    | ComplexesNode;

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
