

type NumberNode = {
    kind: "number",
    value: string,
    // TODO: unit
    // without 'unit', the number is considered dimensionless
};

type InfinityNode = {
    kind: "infinity",
};

type PiNode = {
    kind: "pi",
};

type IdentifierNode = {
    kind: "identifier",
    name: string,
    // TODO: unit
    // it's possible that variables could have units associated with them as well
    // it seems like a bit of an edge case though

    subscript?: NumericExpression,
};

type EllipsisNode = {
    kind: "ellipsis",
};

type AddNode = {
    kind: "add",
    args: NumericExpression[],
};

type MulNode = {
    kind: "mul",
    implicit: boolean,
    args: NumericExpression[],
};

type FuncNode = {
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

type DivNode = {
    kind: "div",
    dividend: NumericExpression,
    divisor: NumericExpression,
};

type ModNode = {
    kind: "mod",
    dividend: NumericExpression,
    divisor: NumericExpression,
};

type RootNode = {
    kind: "root",
    index: NumericExpression,
    radicand: NumericExpression,
};

type ExpNode = {
    kind: "exp",
    base: NumericExpression,
    exp: NumericExpression,
};

type LogNode = {
    kind: "log",
    base: NumericExpression,
    arg: NumericExpression,
};

type NegNode = {
    kind: "neg",
    subtraction: boolean,
    arg: NumericExpression
};

type AbsNode = {
    kind: "abs",
    arg: NumericExpression,
};

// TODO: think about how to define other types of bounds, e.g. sets
type Limits = {
    kind: "limits",
    lower: NumericExpression,
    upper: NumericExpression,
}

type SumNode = {
    kind: "sum",
    arg: NumericExpression,
    bvar: IdentifierNode,
    limits: Limits,
};

type ProdNode = {
    kind: "prod",
    arg: NumericExpression,
    bvar: IdentifierNode,
    limits: Limits,
};

type LimitNode = {
    kind: "limit",
    side: "left" | "right" | "both",
    bvar: IdentifierNode,
    // TODOO: add target 
    arg: NumericExpression,
};

// TODO: think about partial derivatives
type DiffNode = {
    kind: "diff",
    arg: NumericExpression,
    degree: NumericExpression,
    
    // If there's a bvar we use liebniz notation, if not
    // we use prime notation.
    bvar?: IdentifierNode,
};

// TODO: think about multiple integrals
type IntNode = {
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
    | IntNode
    ;

type EqNode = {
    kind: "eq",
    args: NumericExpression[],
};

type NeqNode = {
    kind: "neq",
    args: NumericExpression[],
};

type LtNode = {
    kind: "lt",
    args: NumericExpression[],
};

type LteNode = {
    kind: "lte",
    args: NumericExpression[],
};

type GtNode = {
    kind: "gt",
    args: NumericExpression[],
};

type GteNode = {
    kind: "gte",
    args: NumericExpression[],
};

type AndNode = {
    kind: "and",
    args: LogicExpression[],
};

type OrNode = {
    kind: "or",
    args: LogicExpression[],
};

type XorNode = {
    kind: "xor",
    args: LogicExpression[],
};

type NotNode = {
    kind: "not",
    arg: LogicExpression,
};

type ImpliesNode = {
    kind: "implies",
    args: [LogicExpression, LogicExpression],
};

type IffNode = {
    kind: "iff",
    args: [LogicExpression, LogicExpression],
};

type TrueNode = {
    kind: "true",
};

type FalseNode = {
    kind: "false",
};

type SubsetNode = {
    kind: "subset",
    args: SetExpression[],
};

type ProperSubsetNode = {
    kind: "prsubset",
    args: SetExpression[],
};

type NotSubsetNode = {
    kind: "notsubset",
    args: SetExpression[],
};

type NotProperSubsetNode = {
    kind: "notprsubset",
    args: SetExpression[],
};

type InNode = {
    kind: "in",
    element: IdentifierNode,
    set: SetExpression,
};

type NotInNode = {
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
    | NotProperSubsetNode
    ;


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

type SetNode = {
    kind: "set"
    elements: Expression[], // could also include shapes, strings, images, etc.
};

type EmptySetNode = {
    kind: "empty",
};

type UnionNode = {
    kind: "union",
    args: SetExpression[],
};

type IntersectionNode = {
    kind: "intersection",
    args: SetExpression[],
};

type SetDiffNode = {
    kind: "setdiff",
    args: [SetExpression, SetExpression],
};

type CartesianProductNode = {
    kind: "cartesianproduct",
    args: SetExpression[],
};

type NaturalsNode = {
    kind: "naturals",
};

type IntegersNode = {
    kind: "integers",
};

type RationalsNode = {
    kind: "rationals",
};

type RealsNode = {
    kind: "reals",
};

type ComplexesNode = {
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
    | ComplexesNode
    ;


export type Expression = 
    | NumericExpression
    | LogicExpression
    | SetExpression
    ;


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

