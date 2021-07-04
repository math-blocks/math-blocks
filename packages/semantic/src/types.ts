export type Node = NumericNode | LogicNode | SetNode | VerticalAdd;

// This is a special node describing vertically arranged work, e.g. adding the
// same value to both sides of an equation.
// TODO: support different types of vertical work:
// - arithmetic algorithms
//   - long addition
//   - long subtraction
//   - long multiplication
//   - long division
// - synthetic division/factoring
// - system of equations (adding/subtracting on equation from another)
export type VerticalAdd = Common & {
    // we can use "long_add" to differentiae this from long addition
    readonly type: "vert_add";
    readonly operator: "eq" | "lt" | "gt";
    // expand to TwoOrMore<NumericNode> in the future?
    readonly start: {
        // `null` is allowed in these arrays to support round-tripping of
        // sparse rows.  In particular, if a term is added to both sides, add
        // there's no like-term in the top row on one side the, there needs to
        // be a gap there.
        readonly left: readonly (NumericNode | null)[];
        readonly right: readonly (NumericNode | null)[];
    };
    readonly actions: {
        readonly left: readonly (VerticalWorkAction | null)[];
        readonly right: readonly (VerticalWorkAction | null)[];
    };

    // This is optional because a student could show their work, but adding
    // vertically on one step and then showing the result on the next step.
    // expand to TwoOrMore<NumericNode> in the future?
    readonly result?: {
        // `null` is allowed in these arrays to support round-tripping of
        // sparse rows.  In particular, adding the additive inverse to a column
        // can result in an empty column in the result row if the user doesn't
        // enter a zero there.
        readonly left: readonly (NumericNode | null)[];
        readonly right: readonly (NumericNode | null)[];
    };
};

export type VerticalWorkAction = {
    readonly operator: "plus" | "minus";
    readonly value: NumericNode;
};

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
    | PlusMinus
    | MinusPlus
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
    readonly type: "number";
    readonly value: string;
};

/**
 * Identifier
 */
export type Ident = Common & {
    readonly type: "identifier";
    readonly name: string;
    readonly subscript?: NumericNode;
};

/**
 * Addition
 */
export type Add = Common & {
    readonly type: "add";
    readonly args: TwoOrMore<NumericNode>;
};

/**
 * Multiplication
 */
export type Mul = Common & {
    readonly type: "mul";
    readonly args: TwoOrMore<NumericNode>;
    readonly implicit: boolean;
};

/**
 * Negation
 * Can be used to represent negative values as well as subtraction
 */
export type Neg = Common & {
    readonly type: "neg";
    readonly arg: NumericNode;
    readonly subtraction: boolean; // TODO: change this to `arity: "unary" | "binary";`
};

export type PlusMinus = Common & {
    readonly type: "plusminus";
    readonly arg: NumericNode;
    readonly arity: "unary" | "binary";
};

export type MinusPlus = Common & {
    readonly type: "minusplus";
    readonly arg: NumericNode;
    readonly arity: "unary" | "binary";
};

/**
 * Division
 */
export type Div = Common & {
    readonly type: "div";
    readonly args: readonly [NumericNode, NumericNode];
};

/**
 * Modulus
 */
export type Mod = Common & {
    readonly type: "mod";
    readonly args: readonly [NumericNode, NumericNode];
};

/**
 * Root
 * Can be used for square roots as well nth-degree roots
 */
export type Root = Common & {
    readonly type: "root";
    readonly radicand: NumericNode;
    readonly index: NumericNode;
    readonly sqrt: boolean; // implies index = 2 and that the index should not be rendered
};

/**
 * Power
 */
export type Pow = Common & {
    readonly type: "pow";
    readonly base: NumericNode;
    readonly exp: NumericNode;
};

/**
 * Logarithm
 */
export type Log = Common & {
    readonly type: "log";
    readonly base: NumericNode;
    readonly arg: NumericNode;
};

/**
 * Function
 * Can be used to represent function declaration as well as application.
 */
export type Func = Common & {
    readonly type: "func";
    readonly func: NumericNode;
    readonly args: OneOrMore<NumericNode>;
};

/**
 * Infinity
 */
export type Infinity = Common & {
    readonly type: "infinity";
};

/**
 * pi
 * TODO: Why is pi special?  Maybe we should just use Ident for pi.  What about e?
 */
export type Pi = Common & {
    readonly type: "pi";
};

/**
 * Ellipsis
 */
export type Ellipsis = Common & {
    readonly type: "ellipsis";
};

/**
 * Absolute value
 *
 * e.g. 5! = 1 * 2 * 3 * 4 * 5
 */
export type Abs = Common & {
    readonly type: "abs";
    readonly arg: NumericNode;
};

export type Parens = Common & {
    readonly type: "parens";
    readonly arg: Node;
};

type Bound = {
    readonly value: NumericNode;
    readonly inclusive: boolean; // NOTE: if `value` is +Infinity or -Infinity, this should be false
};

/**
 * Used to represent the limits of an operation such as summation, integration,
 * etc.  Not a node itself and has no id.
 */
type Limits = {
    readonly lower: Bound;
    readonly upper: Bound;
};

/**
 * Summation
 */
export type Sum = Common & {
    readonly type: "sum";
    readonly arg: NumericNode;
    readonly bvar: Ident; // bound variable, i.e. the variable being summed over
    readonly limits: Limits; // TODO: support `condition` and `domainofapplication` as well, see https://www.w3.org/TR/MathML3/chapter4.html#contm.sum
};

/**
 * Product
 */
export type Prod = Common & {
    readonly type: "prod";
    readonly arg: NumericNode;
    readonly bvar: Ident; // bound variable, i.e. the variable being multiplied over
    readonly limits: Limits;
};

type TendsTo = {
    readonly value: NumericNode;
    readonly from?: "above" | "below";
};

/**
 * Limit
 */
export type Limit = Common & {
    readonly type: "lim";
    readonly arg: NumericNode;
    readonly bvar: Ident;
    readonly tendsTo: TendsTo;
};

/**
 * Derivative
 */
export type Diff = Common & {
    readonly type: "diff";
    readonly arg: NumericNode;
    readonly degree?: number; // if no degree is provided this is treated as the first derivative
};

/**
 * Partial derivative
 */
export type PDiff = Common & {
    readonly type: "pdiff";
    // TODO: This is insufficient to model high degree partial derivatives
    // https://www.w3.org/TR/MathML3/chapter4.html#contm.partialdiff
    readonly args: readonly [NumericNode, NumericNode];
};

/**
 * Integral
 */
export type Int = Common & {
    readonly type: "int";
    readonly arg: NumericNode;
    readonly bvar: Ident;
    readonly limits: Limits; // TODO: support `domainofapplication`, see https://www.w3.org/TR/MathML3/chapter4.html#contm.int
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
    readonly type: "true";
};

/**
 * False
 */
export type False = Common & {
    readonly type: "false";
};

/**
 * Logical And (Conjunction)
 */
export type And = Common & {
    readonly type: "and";
    readonly args: TwoOrMore<LogicNode>;
};

/**
 * Logical Or (Disjunction)
 */
export type Or = Common & {
    readonly type: "or";
    readonly args: TwoOrMore<LogicNode>;
};

/**
 * Logical Not (Inverse)
 */
export type Not = Common & {
    readonly type: "not";
    readonly arg: LogicNode;
};

/**
 * Exclusive Or
 */
export type Xor = Common & {
    readonly type: "xor";
    readonly args: TwoOrMore<LogicNode>;
};

export type Implies = Common & {
    readonly type: "implies";
    readonly args: readonly [LogicNode, LogicNode];
};

export type Iff = Common & {
    readonly type: "iff";
    readonly args: TwoOrMore<LogicNode>;
};

/**
 * Equals
 */
export type Eq = Common & {
    readonly type: "eq";
    readonly args:
        | TwoOrMore<NumericNode>
        | TwoOrMore<LogicNode>
        | TwoOrMore<SetNode>;
};

/**
 * Not Equals
 */
export type Neq = Common & {
    readonly type: "neq";
    readonly args:
        | TwoOrMore<NumericNode>
        | TwoOrMore<LogicNode>
        | TwoOrMore<SetNode>;
};

/**
 * Less Than
 */
export type Lt = Common & {
    readonly type: "lt";
    readonly args: TwoOrMore<NumericNode>;
};

/**
 * Less Than or Equal to
 */
export type Lte = Common & {
    readonly type: "lte";
    readonly args: TwoOrMore<NumericNode>;
};

/**
 * Greater Than
 */
export type Gt = Common & {
    readonly type: "gt";
    readonly args: TwoOrMore<NumericNode>;
};

/**
 * Greater Than or Equal to
 */
export type Gte = Common & {
    readonly type: "gte";
    readonly args: TwoOrMore<NumericNode>;
};

/**
 * Element in set
 */
export type In = Common & {
    readonly type: "in";
    readonly element: Node;
    readonly set: SetNode;
};

/**
 * Element is not a set
 */
export type NotIn = Common & {
    readonly type: "notin";
    readonly element: Node;
    readonly set: SetNode;
};

/**
 * Subset
 */
export type Subset = Common & {
    readonly type: "subset";
    readonly args: TwoOrMore<SetNode>;
};

/**
 * Proper Subset
 */
export type ProperSubset = Common & {
    readonly type: "prsubset";
    readonly args: TwoOrMore<SetNode>;
};

/**
 * Not a Subset
 */
export type NotSubset = Common & {
    readonly type: "notsubset";
    readonly args: TwoOrMore<SetNode>;
};

/**
 * Propert Not a Subset
 */
export type NotProperSubset = Common & {
    readonly type: "notprsubset";
    readonly args: TwoOrMore<SetNode>;
};

/**
 * When evaluated the result is a set.
 */
export type SetNode =
    | Ident
    | Set // eslint-disable-line functional/prefer-readonly-type
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
    readonly type: "set";
    readonly args: readonly Node[]; // TODO: expand this to include other things like words, shapes, images, etc.
};

/**
 * Empty Set
 * A set containing no elements.
 */
export type EmptySet = Common & {
    readonly type: "empty";
};

/**
 * Union
 */
export type Union = Common & {
    readonly type: "union";
    readonly args: TwoOrMore<SetNode>;
};

/**
 * Intersection
 */
export type Intersection = Common & {
    readonly type: "intersection";
    readonly args: TwoOrMore<SetNode>;
};

/**
 * Set Difference
 */
export type SetDiff = Common & {
    readonly type: "setdiff";
    readonly args: readonly [SetNode, SetNode];
};

/**
 * Cartesian Product
 */
export type CartesianProduct = Common & {
    readonly type: "cartesian_product";
    readonly args: TwoOrMore<SetNode>;
};

/**
 * Natural Numbers (counting numbers)
 * e.g. 1, 2, 3, ...
 */
export type Naturals = Common & {
    readonly type: "naturals";
};

/**
 * Integers
 * e.g. ..., -2, -1, 0, 1, 2, ...
 */
export type Integers = Common & {
    readonly type: "integers";
};

/**
 * Rationals
 * p / q, where p and q are integers
 */
export type Rationals = Common & {
    readonly type: "rationals";
};

/**
 * Real Numbers
 */
export type Reals = Common & {
    readonly type: "reals";
};

/**
 * Complex Numbers
 */
export type Complexes = Common & {
    readonly type: "complexes";
};

export interface Common {
    readonly id: number;
    readonly loc?: SourceLocation;
    // TODO: rename this to something less ambiguous
    source?: string; // eslint-disable-line functional/prefer-readonly-type
}

// TODO: dedupe with editor-core and parser-factory
export interface SourceLocation {
    readonly path: readonly number[];
    readonly start: number;
    readonly end: number;
}
