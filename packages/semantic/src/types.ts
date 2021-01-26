export type Node = NumericNode | LogicNode | SetNode;

/**
 * When a numeric node is evaluated it should return another numeric node.
 */
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

/**
 * Number
 *
 * TODO:
 * - handle units, e.g. m/s, kg, etc.
 * - add ComplexNumber type
 */
export type Num = Common & {
    type: "number";
    value: string;
};

/**
 * Identifier
 */
export type Ident = Common & {
    type: "identifier";
    name: string;
    subscript?: NumericNode;
};

/**
 * Addition
 */
export type Add = Common & {
    type: "add";
    args: TwoOrMore<NumericNode>;
};

/**
 * Multiplication
 */
export type Mul = Common & {
    type: "mul";
    args: TwoOrMore<NumericNode>;
    implicit: boolean;
};

/**
 * Negation
 * Can be used to represent negative values as well as subtraction
 */
export type Neg = Common & {
    type: "neg";
    arg: NumericNode;
    subtraction: boolean;
};

/**
 * Division
 */
export type Div = Common & {
    type: "div";
    args: readonly [NumericNode, NumericNode];
};

/**
 * Modulus
 */
export type Mod = Common & {
    type: "mod";
    args: readonly [NumericNode, NumericNode];
};

/**
 * Root
 * Can be used for square roots as well nth-degree roots
 */
export type Root = Common & {
    type: "root";
    radicand: NumericNode;
    index: NumericNode;
    sqrt: boolean; // implies index = 2 and that the index should not be rendered
};

/**
 * Power
 */
export type Pow = Common & {
    type: "pow";
    base: NumericNode;
    exp: NumericNode;
};

/**
 * Logarithm
 */
export type Log = Common & {
    type: "log";
    base: NumericNode;
    arg: NumericNode;
};

/**
 * Function
 * Can be used to represent function declaration as well as application.
 */
export type Func = Common & {
    type: "func";
    func: NumericNode;
    args: OneOrMore<NumericNode>;
};

/**
 * Infinity
 */
export type Infinity = Common & {
    type: "infinity";
};

/**
 * pi
 * TODO: Why is pi special?  Maybe we should just use Ident for pi.  What about e?
 */
export type Pi = Common & {
    type: "pi";
};

/**
 * Ellipsis
 */
export type Ellipsis = Common & {
    type: "ellipsis";
};

/**
 * Absolute value
 *
 * e.g. 5! = 1 * 2 * 3 * 4 * 5
 */
export type Abs = Common & {
    type: "abs";
    arg: NumericNode;
};

export type Parens = Common & {
    type: "parens";
    arg: Node;
};

type Bound = {
    value: NumericNode;
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
    arg: NumericNode;
    bvar: Ident; // bound variable, i.e. the variable being summed over
    limits: Limits; // TODO: support `condition` and `domainofapplication` as well, see https://www.w3.org/TR/MathML3/chapter4.html#contm.sum
};

/**
 * Product
 */
export type Prod = Common & {
    type: "prod";
    arg: NumericNode;
    bvar: Ident; // bound variable, i.e. the variable being multiplied over
    limits: Limits;
};

type TendsTo = {
    value: NumericNode;
    from?: "above" | "below";
};

/**
 * Limit
 */
export type Limit = Common & {
    type: "lim";
    arg: NumericNode;
    bvar: Ident;
    tendsTo: TendsTo;
};

/**
 * Derivative
 */
export type Diff = Common & {
    type: "diff";
    arg: NumericNode;
    degree?: number; // if no degree is provided this is treated as the first derivative
};

/**
 * Partial derivative
 */
export type PDiff = Common & {
    type: "pdiff";
    // TODO: This is insufficient to model high degree partial derivatives
    // https://www.w3.org/TR/MathML3/chapter4.html#contm.partialdiff
    args: [NumericNode, NumericNode];
};

/**
 * Integral
 */
export type Int = Common & {
    type: "int";
    arg: NumericNode;
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
    args: TwoOrMore<LogicNode>;
};

/**
 * Logical Or (Disjunction)
 */
export type Or = Common & {
    type: "or";
    args: TwoOrMore<LogicNode>;
};

/**
 * Logical Not (Inverse)
 */
export type Not = Common & {
    type: "not";
    arg: LogicNode;
};

/**
 * Exclusive Or
 */
export type Xor = Common & {
    type: "xor";
    args: TwoOrMore<LogicNode>;
};

export type Implies = Common & {
    type: "implies";
    args: readonly [LogicNode, LogicNode];
};

export type Iff = Common & {
    type: "iff";
    args: TwoOrMore<LogicNode>;
};

/**
 * Equals
 */
export type Eq = Common & {
    type: "eq";
    args: TwoOrMore<NumericNode> | TwoOrMore<LogicNode> | TwoOrMore<SetNode>;
};

/**
 * Not Equals
 */
export type Neq = Common & {
    type: "neq";
    args: TwoOrMore<NumericNode> | TwoOrMore<LogicNode> | TwoOrMore<SetNode>;
};

/**
 * Less Than
 */
export type Lt = Common & {
    type: "lt";
    args: TwoOrMore<NumericNode>;
};

/**
 * Less Than or Equal to
 */
export type Lte = Common & {
    type: "lte";
    args: TwoOrMore<NumericNode>;
};

/**
 * Greater Than
 */
export type Gt = Common & {
    type: "gt";
    args: TwoOrMore<NumericNode>;
};

/**
 * Greater Than or Equal to
 */
export type Gte = Common & {
    type: "gte";
    args: TwoOrMore<NumericNode>;
};

/**
 * Element in set
 */
export type In = Common & {
    type: "in";
    element: Node;
    set: SetNode;
};

/**
 * Element is not a set
 */
export type NotIn = Common & {
    type: "notin";
    element: Node;
    set: SetNode;
};

/**
 * Subset
 */
export type Subset = Common & {
    type: "subset";
    args: TwoOrMore<SetNode>;
};

/**
 * Proper Subset
 */
export type ProperSubset = Common & {
    type: "prsubset";
    args: TwoOrMore<SetNode>;
};

/**
 * Not a Subset
 */
export type NotSubset = Common & {
    type: "notsubset";
    args: TwoOrMore<SetNode>;
};

/**
 * Propert Not a Subset
 */
export type NotProperSubset = Common & {
    type: "notprsubset";
    args: TwoOrMore<SetNode>;
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
    args: TwoOrMore<SetNode>;
};

/**
 * Intersection
 */
export type Intersection = Common & {
    type: "intersection";
    args: TwoOrMore<SetNode>;
};

/**
 * Set Difference
 */
export type SetDiff = Common & {
    type: "setdiff";
    args: [SetNode, SetNode];
};

/**
 * Cartesian Product
 */
export type CartesianProduct = Common & {
    type: "cartesian_product";
    args: TwoOrMore<SetNode>;
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
    source?: string;
}

// TODO: dedupe with editor-core and parser-factory
export interface SourceLocation {
    path: readonly number[];
    start: number;
    end: number;
}
