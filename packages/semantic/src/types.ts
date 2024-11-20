import { NodeType } from './enums';

export interface Common<T extends NodeType> {
  readonly type: T;
  readonly id: number;
  readonly loc?: SourceLocation;
  // TODO: rename this to something less ambiguous
  source?: string; // eslint-disable-line functional/prefer-readonly-type
}

export type Node = NumericNode | LogicNode | SetNode;

/**
 * When a numeric node is evaluated it should return another numeric node.
 */
export type NumericNode =
  | Num
  | Infinity
  | Pi
  | Identifier
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
  | Product
  | Limit
  | Derivative
  | PartialDerivative
  | Integral;

export type NumericRelation =
  | Eq<NumericNode>
  // | Neq
  | Lt
  | Gt
  | Lte
  | Gte;

export type NumRelType =
  | NodeType.Equals
  // | NodeType.NotEquals
  | NodeType.LessThan
  | NodeType.GreaterThan
  | NodeType.LessThanOrEquals
  | NodeType.GreaterThanOrEquals;

/**
 * Number
 *
 * TODO:
 * - handle units, e.g. m/s, kg, etc.
 * - add ComplexNumber type
 */
export type Num = Common<NodeType.Number> & {
  readonly value: string;
};

/**
 * Identifier
 */
export type Identifier = Common<NodeType.Identifier> & {
  readonly name: string;
  readonly subscript?: NumericNode;
};

/**
 * Addition
 */
export type Add = Common<NodeType.Add> & {
  readonly args: TwoOrMore<NumericNode>;
};

/**
 * Multiplication
 */
export type Mul = Common<NodeType.Mul> & {
  readonly args: TwoOrMore<NumericNode>;
  readonly implicit: boolean;
};

/**
 * Negation
 * Can be used to represent negative values as well as subtraction
 */
export type Neg = Common<NodeType.Neg> & {
  readonly arg: NumericNode;
  readonly subtraction: boolean; // TODO: change this to `arity: "unary" | "binary";`
};

export type PlusMinus = Common<NodeType.PlusMinus> & {
  readonly args: OneOrMore<NumericNode>;
};

export type MinusPlus = Common<NodeType.MinusPlus> & {
  readonly args: OneOrMore<NumericNode>;
};

/**
 * Division
 */
export type Div = Common<NodeType.Div> & {
  readonly args: readonly [NumericNode, NumericNode];
};

/**
 * Modulus
 */
export type Mod = Common<NodeType.Modulo> & {
  readonly args: readonly [NumericNode, NumericNode];
};

/**
 * Root
 * Can be used for square roots as well nth-degree roots
 */
export type Root = Common<NodeType.Root> & {
  readonly radicand: NumericNode;
  readonly index: NumericNode;
  readonly sqrt: boolean; // implies index = 2 and that the index should not be rendered
};

/**
 * Power
 */
export type Pow = Common<NodeType.Power> & {
  readonly base: NumericNode;
  readonly exp: NumericNode;
};

/**
 * Logarithm
 */
export type Log = Common<NodeType.Log> & {
  readonly base: NumericNode;
  readonly arg: NumericNode;
};

/**
 * Function
 * Can be used to represent function declaration as well as application.
 * TODO: split this into separate nodes for function declaration vs function evaluation
 */
export type Func = Common<NodeType.Func> & {
  readonly func: NumericNode;
  readonly args: OneOrMore<NumericNode>;
};

/**
 * Infinity
 */
export type Infinity = Common<NodeType.Infinity>;

/**
 * pi
 * TODO: Why is pi special?  Maybe we should just use Ident for pi.  What about e?
 */
export type Pi = Common<NodeType.Pi>;

/**
 * Ellipsis
 */
export type Ellipsis = Common<NodeType.Ellipsis>;

/**
 * Absolute value
 *
 * e.g. 5! = 1 * 2 * 3 * 4 * 5
 */
export type Abs = Common<NodeType.AbsoluteValue> & {
  readonly arg: NumericNode;
};

export type Parens = Common<NodeType.Parens> & {
  readonly arg: Node;
};

export type Bound = {
  readonly value: NumericNode;
  readonly inclusive: boolean; // NOTE: if `value` is +Infinity or -Infinity, this should be false
};

/**
 * Used to represent the limits of an operation such as summation, integration,
 * etc.  Not a node itself and has no id.
 */
export type Limits = {
  readonly lower: Bound;
  readonly upper: Bound;
};

/**
 * Summation
 */
export type Sum = Common<NodeType.Summation> & {
  readonly arg: NumericNode;
  readonly bvar: Identifier; // bound variable, i.e. the variable being summed over
  // TODO: support `condition` and `domainofapplication` as well,
  // see https://www.w3.org/TR/MathML3/chapter4.html#contm.sum
  readonly limits: Limits;
};

/**
 * Product
 */
export type Product = Common<NodeType.Product> & {
  readonly arg: NumericNode;
  readonly bvar: Identifier; // bound variable, i.e. the variable being multiplied over
  readonly limits: Limits;
};

/**
 * Limit
 */
export type Limit = Common<NodeType.Limit> & {
  readonly arg: NumericNode;
  readonly bvar: Identifier;
  readonly value: NumericNode;
  readonly dir?: 'plus' | 'minus';
};

/**
 * Derivative
 */
export type Derivative = Common<NodeType.Derivative> & {
  readonly arg: NumericNode;
  readonly degree?: number; // if no degree is provided this is treated as the first derivative
};

/**
 * Partial derivative
 */
export type PartialDerivative = Common<NodeType.PartialDerivative> & {
  readonly arg: NumericNode;
  readonly variables: readonly Identifier[];
  readonly degrees: readonly NumericNode[];
};

/**
 * Integral
 */
export type Integral = Common<NodeType.Integral> & {
  readonly arg: NumericNode;
  readonly bvar: Identifier;
  // TODO: support `domainofapplication`,
  // see https://www.w3.org/TR/MathML3/chapter4.html#contm.int
  readonly limits: Limits;
};

type RelationOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';

export type VerticalAdditionToRelation =
  Common<NodeType.VerticalAdditionToRelation> & {
    readonly relOp: RelationOperator;
    readonly originalRelation: {
      readonly left: readonly (NumericNode | null)[];
      readonly right: readonly (NumericNode | null)[];
    };
    readonly actions: {
      readonly left: readonly (NumericNode | null)[];
      readonly right: readonly (NumericNode | null)[];
    };
    readonly resultingRelation?: {
      readonly left: readonly (NumericNode | null)[];
      readonly right: readonly (NumericNode | null)[];
    };
  };

// When complete, the result of this is a logic value
export type SystemOfRelationsElimination =
  Common<NodeType.SystemOfRelationsElimination> & {
    readonly relOp: RelationOperator;
    // TODO: fill this out
    // two or three rows
  };

// Basic Arithmetic Algorithms

// Numbers that are Digits should only have a single digit
type Digit = Num;

// TODO: extend these types to support decimals

// When complete, the result of this is a numeric value
export type LongAddition = Common<NodeType.LongAddition> & {
  readonly terms: readonly (readonly Digit[])[];
  readonly sum: readonly (Digit | null)[];
  readonly carries: readonly (Digit | null)[];
};

// When complete, the result of this is a numeric value
export type LongSubtraction = Common<NodeType.LongSubtraction> & {
  readonly minuend: readonly Digit[];
  readonly subtrahend: readonly (Digit | null)[];
  readonly difference: readonly (Digit | null)[];
  readonly borrows: readonly (Digit | null)[];
};

// When complete, the result of this is a numeric value
export type LongMultiplication = Common<NodeType.LongMultiplication> & {
  readonly factors: readonly (readonly Digit[])[];
  readonly partialProducts: readonly (readonly Digit[])[];
  readonly product: readonly (Digit | null)[];
  readonly carries: readonly (Digit | null)[]; // Used when adding the partial products
};

// When complete, the result of this is a numeric value
export type LongDivision = Common<NodeType.LongDivision> & {
  readonly dividend: readonly Digit[];
  readonly divisor: readonly (Digit | null)[];
  readonly quotient: readonly (Digit | null)[];
  readonly remainder?: Num;

  // TODO: figure out how to model partial remainders and
  // the other parts of long division work
};

/**
 * When a logic node is evaluated the resulting value is either True or False.
 */
export type LogicNode =
  | Identifier
  | True
  | False
  | Conjunction
  | Disjunction
  | Not
  | Xor
  | Implies
  | Iff
  | Parens
  // This avoids having a circular reference
  | (Common<NodeType.Equals> & {
      readonly args: TwoOrMore<Node>;
    })
  | VerticalAdditionToRelation
  | LongAddition
  | LongSubtraction
  | LongMultiplication
  | LongDivision
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
export type True = Common<NodeType.True>;

/**
 * False
 */
export type False = Common<NodeType.False>;

/**
 * Conjunction
 */
export type Conjunction = Common<NodeType.LogicalAnd> & {
  readonly args: TwoOrMore<LogicNode>;
};

/**
 * Disjunction
 */
export type Disjunction = Common<NodeType.LogicalOr> & {
  readonly args: TwoOrMore<LogicNode>;
};

/**
 * Logical Not (Inverse)
 */
export type Not = Common<NodeType.LogicalNot> & {
  readonly arg: LogicNode;
};

/**
 * Exclusive Or
 */
export type Xor = Common<NodeType.ExclusiveOr> & {
  readonly args: TwoOrMore<LogicNode>;
};

export type Implies = Common<NodeType.Conditional> & {
  readonly args: readonly [LogicNode, LogicNode];
};

export type Iff = Common<NodeType.Biconditional> & {
  readonly args: TwoOrMore<LogicNode>;
};

/**
 * Equals
 */
export type Eq<T extends Node = Node> = Common<NodeType.Equals> & {
  readonly args: TwoOrMore<T>;
};

/**
 * Not Equals
 */
export type Neq = Common<NodeType.NotEquals> & {
  readonly args:
    | TwoOrMore<NumericNode>
    | TwoOrMore<LogicNode>
    | TwoOrMore<SetNode>;
};

/**
 * Less Than
 */
export type Lt = Common<NodeType.LessThan> & {
  readonly args: TwoOrMore<NumericNode>;
};

/**
 * Less Than or Equal to
 */
export type Lte = Common<NodeType.LessThanOrEquals> & {
  readonly args: TwoOrMore<NumericNode>;
};

/**
 * Greater Than
 */
export type Gt = Common<NodeType.GreaterThan> & {
  readonly args: TwoOrMore<NumericNode>;
};

/**
 * Greater Than or Equal to
 */
export type Gte = Common<NodeType.GreaterThanOrEquals> & {
  readonly args: TwoOrMore<NumericNode>;
};

/**
 * Element in set
 */
export type In = Common<NodeType.ElementOf> & {
  readonly element: Node;
  readonly set: SetNode;
};

/**
 * Element is not a set
 */
export type NotIn = Common<NodeType.NotElementOf> & {
  readonly element: Node;
  readonly set: SetNode;
};

/**
 * Subset
 */
export type Subset = Common<NodeType.Subset> & {
  readonly args: TwoOrMore<SetNode>;
};

/**
 * Proper Subset
 */
export type ProperSubset = Common<NodeType.ProperSubset> & {
  readonly args: TwoOrMore<SetNode>;
};

/**
 * Not a Subset
 */
export type NotSubset = Common<NodeType.NotSubset> & {
  readonly args: TwoOrMore<SetNode>;
};

/**
 * Propert Not a Subset
 */
export type NotProperSubset = Common<NodeType.NotProperSubset> & {
  readonly args: TwoOrMore<SetNode>;
};

/**
 * When evaluated the result is a set.
 */
export type SetNode =
  | Identifier
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
export type Set = Common<NodeType.Set> & {
  // TODO: expand this to include other things like words, shapes, images, etc.
  readonly args: readonly Node[];
};

/**
 * Empty Set
 * A set containing no elements.
 */
export type EmptySet = Common<NodeType.EmptySet>;

/**
 * Union
 */
export type Union = Common<NodeType.Union> & {
  readonly args: TwoOrMore<SetNode>;
};

/**
 * Intersection
 */
export type Intersection = Common<NodeType.SetIntersection> & {
  readonly args: TwoOrMore<SetNode>;
};

/**
 * Set Difference
 */
export type SetDiff = Common<NodeType.SetDifference> & {
  readonly args: readonly [SetNode, SetNode];
};

/**
 * Cartesian Product
 */
export type CartesianProduct = Common<NodeType.CartesianProduct> & {
  readonly args: TwoOrMore<SetNode>;
};

/**
 * Natural Numbers (counting numbers)
 * e.g. 1, 2, 3, ...
 */
export type Naturals = Common<NodeType.Naturals>;

/**
 * Integers
 * e.g. ..., -2, -1, 0, 1, 2, ...
 */
export type Integers = Common<NodeType.Integers>;

/**
 * Rationals
 * p / q, where p and q are integers
 */
export type Rationals = Common<NodeType.Rationals>;

/**
 * Real Numbers
 */
export type Reals = Common<NodeType.Reals>;

/**
 * Complex Numbers
 */
export type Complexes = Common<NodeType.Complexes>;

// TODO: dedupe with editor and parser
export interface SourceLocation {
  readonly path: readonly number[];
  readonly start: number;
  readonly end: number;
}
