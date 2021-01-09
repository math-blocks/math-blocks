// TODO: autogenerate this file from packages/semantic/src/types.ts
// It should be a simple find-n-replace of all uses of NumericNode, LogicNode,
// and SetNode with Node (outside of the definitions of these Node themselves).

export type Node = NumericNode | LogicNode | SetNode;
export type NumericNode =
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
    | Pow
    | Log
    | Neg
    | Abs
    | Parens
    | Sum
    | Prod
    | Limit
    | Diff
    | PDiff
    | Int;

export type Num = Common & {
    type: "number";
    value: string;
};

export type Infinity = Common & {
    type: "infinity";
};

export type Pi = Common & {
    type: "pi";
};

export type Ident = Common & {
    type: "identifier";
    name: string;
    subscript?: Node;
};

export type Ellipsis = Common & {
    type: "ellipsis";
};

export type Add = Common & {
    type: "add";
    args: TwoOrMore<Node>;
};

export type Mul = Common & {
    type: "mul";
    args: TwoOrMore<Node>;
    implicit: boolean;
};

export type Func = Common & {
    type: "func";
    func: Node;
    args: OneOrMore<Node>;
};

export type Div = Common & {
    type: "div";
    args: readonly [Node, Node];
};

export type Mod = Common & {
    type: "mod";
    args: readonly [Node, Node];
};

export type Root = Common & {
    type: "root";
    radicand: Node;
    index: Node;
    sqrt: boolean; // implies index = 2 and that the index should not be rendered
};

export type Pow = Common & {
    type: "pow";
    base: Node;
    exp: Node;
};

export type Log = Common & {
    type: "log";
    base: Node;
    arg: Node;
};

export type Neg = Common & {
    type: "neg";
    arg: Node;
    subtraction: boolean;
};

/**
 * Absolute value
 *
 * e.g. 5! = 1 * 2 * 3 * 4 * 5
 */
export type Abs = Common & {
    type: "abs";
    arg: Node;
};

export type Parens = Common & {
    type: "parens";
    arg: Node;
};

type Bound = {
    value: Node;
    inclusive: boolean; // NOTE: if `value` is +Infinity or -Infinity, this should be false
};

/**
 * Used to represent the limits of an operation such as summation, integration,
 * etc.  Not a node itself and has no id.
 */
type Limits = {
    lower: Bound;
    upper: Bound;
};

/**
 * Summation
 */
export type Sum = Common & {
    type: "sum";
    arg: Node;
    bvar: Ident; // bound variable, i.e. the variable being summed over
    limits: Limits; // TODO: support `condition` and `domainofapplication` as well, see https://www.w3.org/TR/MathML3/chapter4.html#contm.sum
};

/**
 * Product
 */
export type Prod = Common & {
    type: "prod";
    arg: Node;
    bvar: Ident; // bound variable, i.e. the variable being multiplied over
    limits: Limits;
};

type TendsTo = {
    value: Node;
    from?: "above" | "below";
};

/**
 * Limit
 */
export type Limit = Common & {
    type: "lim";
    arg: Node;
    bvar: Ident;
    tendsTo: TendsTo;
};

/**
 * Derivative
 */
export type Diff = Common & {
    type: "diff";
    arg: Node;
    degree?: number; // if no degree is provided this is treated as the first derivative
};

/**
 * Partial derivative
 */
export type PDiff = Common & {
    type: "pdiff";
    // TODO: This is insufficient to model high degree partial derivatives
    // https://www.w3.org/TR/MathML3/chapter4.html#contm.partialdiff
    args: [Node, Node];
};

export type Int = Common & {
    type: "int";
    arg: Node;
    bvar: Ident;
    limits: Limits; // TODO: support `domainofapplication`, see https://www.w3.org/TR/MathML3/chapter4.html#contm.int
};

/**
 * When a logic node is evaluated the resulting value is either True or False.
 */
export type LogicNode =
    | Ident
    | True
    | False
    | And
    | Or
    | Not
    | Xor
    | Implies
    | Iff
    | Parens
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

/**
 * True
 */
export type True = Common & {
    type: "true";
};

/**
 * False
 */
export type False = Common & {
    type: "false";
};

/**
 * Logical And (Conjunction)
 */
export type And = Common & {
    type: "and";
    args: TwoOrMore<Node>;
};

/**
 * Logical Or (Disjunction)
 */
export type Or = Common & {
    type: "or";
    args: TwoOrMore<Node>;
};

/**
 * Logical Not (Inverse)
 */
export type Not = Common & {
    type: "not";
    arg: Node;
};

/**
 * Exclusive Or
 */
export type Xor = Common & {
    type: "xor";
    args: TwoOrMore<Node>;
};

export type Implies = Common & {
    type: "implies";
    args: readonly [Node, Node];
};

export type Iff = Common & {
    type: "iff";
    args: TwoOrMore<Node>;
};

/**
 * Equals
 */
export type Eq = Common & {
    type: "eq";
    args: TwoOrMore<Node> | TwoOrMore<Node> | TwoOrMore<Node>;
};

/**
 * Not Equals
 */
export type Neq = Common & {
    type: "neq";
    args: TwoOrMore<Node> | TwoOrMore<Node> | TwoOrMore<Node>;
};

/**
 * Less Than
 */
export type Lt = Common & {
    type: "lt";
    args: TwoOrMore<Node>;
};

/**
 * Less Than or Equal to
 */
export type Lte = Common & {
    type: "lte";
    args: TwoOrMore<Node>;
};

/**
 * Greater Than
 */
export type Gt = Common & {
    type: "gt";
    args: TwoOrMore<Node>;
};

/**
 * Greater Than or Equal to
 */
export type Gte = Common & {
    type: "gte";
    args: TwoOrMore<Node>;
};

/**
 * Element in set
 */
export type In = Common & {
    type: "in";
    element: Node;
    set: Node;
};

/**
 * Element is not a set
 */
export type NotIn = Common & {
    type: "notin";
    element: Node;
    set: Node;
};

/**
 * Subset
 */
export type Subset = Common & {
    type: "subset";
    args: TwoOrMore<Node>;
};

/**
 * Proper Subset
 */
export type ProperSubset = Common & {
    type: "prsubset";
    args: TwoOrMore<Node>;
};

/**
 * Not a Subset
 */
export type NotSubset = Common & {
    type: "notsubset";
    args: TwoOrMore<Node>;
};

/**
 * Propert Not a Subset
 */
export type NotProperSubset = Common & {
    type: "notprsubset";
    args: TwoOrMore<Node>;
};

/**
 * When evaluated the result is a set.
 */
export type SetNode =
    | Ident
    | Set
    | EmptySet
    | Union
    | Intersection
    | SetDiff
    | CartesianProduct
    | Parens
    | Naturals
    | Integers
    | Rationals
    | Reals
    | Complexes;

/**
 * Set containing zero or more elements
 */
export type Set = Common & {
    type: "set";
    args: readonly Node[]; // TODO: expand this to include other things like words, shapes, images, etc.
};

/**
 * Empty Set
 * A set containing no elements.
 */
export type EmptySet = Common & {
    type: "empty";
};

/**
 * Union
 */
export type Union = Common & {
    type: "union";
    args: TwoOrMore<Node>;
};

/**
 * Intersection
 */
export type Intersection = Common & {
    type: "intersection";
    args: TwoOrMore<Node>;
};

/**
 * Set Difference
 */
export type SetDiff = Common & {
    type: "setdiff";
    args: [Node, Node];
};

/**
 * Cartesian Product
 */
export type CartesianProduct = Common & {
    type: "cartesian_product";
    args: TwoOrMore<Node>;
};

/**
 * Natural Numbers (counting numbers)
 * e.g. 1, 2, 3, ...
 */
export type Naturals = Common & {
    type: "naturals";
};

/**
 * Integers
 * e.g. ..., -2, -1, 0, 1, 2, ...
 */
export type Integers = Common & {
    type: "integers";
};

/**
 * Rationals
 * p / q, where p and q are integers
 */
export type Rationals = Common & {
    type: "rationals";
};

/**
 * Real Numbers
 */
export type Reals = Common & {
    type: "reals";
};

/**
 * Complex Numbers
 */
export type Complexes = Common & {
    type: "complexes";
};

export interface Common {
    id: number;
    loc?: SourceLocation;
}
export interface SourceLocation {
    path: readonly number[];
    start: number;
    end: number;
}
