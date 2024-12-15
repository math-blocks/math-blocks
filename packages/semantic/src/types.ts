// This file is generated by scripts/codegen.ts
// Do not edit this file directly

export type SourceLocation = {
  readonly path: readonly number[];
  readonly start: number;
  readonly end: number;
};

export type Common<T extends string> = {
  readonly type: T;
  readonly id: number;
  readonly loc?: SourceLocation;
  source?: string; // eslint-disable-line functional/prefer-readonly-type
};

export interface NodeTypes {
  readonly Number: Common<'Number'> & {readonly value: string}
  readonly Identifier: Common<'Identifier'> & {
    readonly name: string,
    readonly subscript?: Node,
  },
  readonly Function: Common<'Function'> & {
    readonly func: Node,
    readonly args: readonly Node[],
  },
  readonly Add: Common<'Add'> & {readonly args: TwoOrMore<Node>}
  readonly Mul: Common<'Mul'> & {
    readonly args: TwoOrMore<Node>,
    readonly implicit: boolean,
  },
  readonly PlusMinus: Common<'PlusMinus'> & {readonly args: TwoOrMore<Node>}
  readonly MinusPlus: Common<'MinusPlus'> & {readonly args: TwoOrMore<Node>}
  readonly UnaryPlusMinus: Common<'UnaryPlusMinus'> & {readonly arg: Node}
  readonly UnaryMinusPlus: Common<'UnaryMinusPlus'> & {readonly arg: Node}
  readonly Div: Common<'Div'> & {readonly args: readonly [Node, Node]}
  readonly Mod: Common<'Modulo'> & {readonly args: readonly [Node, Node]}
  readonly Pow: Common<'Power'> & {
    readonly base: Node,
    readonly exp: Node,
  },
  readonly Root: Common<'Root'> & {
    readonly radicand: Node,
    readonly index: Node,
    readonly sqrt: boolean,
  },
  readonly Abs: Common<'AbsoluteValue'> & {readonly arg: Node}
  readonly Neg: Common<'Neg'> & {
    readonly arg: Node,
    readonly subtraction: boolean,
  },
  readonly Sin: Common<'Sin'> & {readonly arg: Node}
  readonly Cos: Common<'Cos'> & {readonly arg: Node}
  readonly Tan: Common<'Tan'> & {readonly arg: Node}
  readonly Cot: Common<'Cot'> & {readonly arg: Node}
  readonly Sec: Common<'Sec'> & {readonly arg: Node}
  readonly Csc: Common<'Csc'> & {readonly arg: Node}
  readonly ArcSin: Common<'ArcSin'> & {readonly arg: Node}
  readonly ArcCos: Common<'ArcCos'> & {readonly arg: Node}
  readonly ArcTan: Common<'ArcTan'> & {readonly arg: Node}
  readonly ArcCot: Common<'ArcCot'> & {readonly arg: Node}
  readonly ArcSec: Common<'ArcSec'> & {readonly arg: Node}
  readonly ArcCsc: Common<'ArcCsc'> & {readonly arg: Node}
  readonly Log: Common<'Log'> & {
    readonly base: Node,
    readonly arg: Node,
  },
  readonly Ln: Common<'Ln'> & {readonly arg: Node}
  readonly Exp: Common<'Exp'> & {readonly arg: Node}
  readonly Gt: Common<'GreaterThan'> & {readonly args: TwoOrMore<Node>}
  readonly Gte: Common<'GreaterThanOrEquals'> & {readonly args: TwoOrMore<Node>}
  readonly Lt: Common<'LessThan'> & {readonly args: TwoOrMore<Node>}
  readonly Lte: Common<'LessThanOrEquals'> & {readonly args: TwoOrMore<Node>}
  readonly Infinity: Common<'Infinity'>,
  readonly Pi: Common<'Pi'>,
  readonly E: Common<'E'>,
  readonly Ellipsis: Common<'Ellipsis'>,
  readonly And: Common<'LogicalAnd'> & {readonly args: TwoOrMore<Node>}
  readonly Or: Common<'LogicalOr'> & {readonly args: TwoOrMore<Node>}
  readonly Xor: Common<'ExclusiveOr'> & {readonly args: TwoOrMore<Node>}
  readonly Not: Common<'LogicalNot'> & {readonly arg: Node}
  readonly Implies: Common<'Conditional'> & {readonly args: readonly [Node, Node]}
  readonly Equivalent: Common<'Biconditional'> & {readonly args: readonly [Node, Node]}
  readonly True: Common<'True'>,
  readonly False: Common<'False'>,
  readonly Set: Common<'Set'> & {readonly args: TwoOrMore<Node>}
  readonly Union: Common<'Union'> & {readonly args: TwoOrMore<Node>}
  readonly Intersection: Common<'SetIntersection'> & {readonly args: TwoOrMore<Node>}
  readonly CartesianProduct: Common<'CartesianProduct'> & {readonly args: TwoOrMore<Node>}
  readonly SetDiff: Common<'SetDifference'> & {readonly args: readonly [Node, Node]}
  readonly Subset: Common<'Subset'> & {readonly args: TwoOrMore<Node>}
  readonly ProperSubset: Common<'ProperSubset'> & {readonly args: TwoOrMore<Node>}
  readonly Superset: Common<'Superset'> & {readonly args: TwoOrMore<Node>}
  readonly ProperSuperset: Common<'ProperSuperset'> & {readonly args: TwoOrMore<Node>}
  readonly NotSubset: Common<'NotSubset'> & {readonly args: readonly [Node, Node]}
  readonly NotProperSubset: Common<'NotProperSubset'> & {readonly args: readonly [Node, Node]}
  readonly NotSuperset: Common<'NotSuperset'> & {readonly args: readonly [Node, Node]}
  readonly NotProperSuperset: Common<'NotProperSuperset'> & {readonly args: readonly [Node, Node]}
  readonly In: Common<'ElementOf'> & {
    readonly element: Node,
    readonly set: Node,
  },
  readonly NotIn: Common<'NotElementOf'> & {
    readonly element: Node,
    readonly set: Node,
  },
  readonly EmptySet: Common<'EmptySet'>,
  readonly Naturals: Common<'Naturals'>,
  readonly Integers: Common<'Integers'>,
  readonly Rationals: Common<'Rationals'>,
  readonly Reals: Common<'Reals'>,
  readonly Complexes: Common<'Complexes'>,
  readonly Matrix: Common<'Matrix'> & {
    readonly args: TwoOrMore<Node>,
    readonly rows: number,
    readonly cols: number,
  },
  readonly Vector: Common<'Vector'> & {
    readonly args: TwoOrMore<Node>,
    readonly dim: number,
  },
  readonly Determinant: Common<'Determinant'> & {readonly arg: Node}
  readonly Transpose: Common<'Transpose'> & {readonly arg: Node}
  readonly VectorProduct: Common<'VectorProduct'> & {readonly args: readonly [Node, Node]}
  readonly ScalarProduct: Common<'ScalarProduct'> & {readonly args: readonly [Node, Node]}
  readonly Limit: Common<'Limit'> & {
    readonly arg: Node,
    readonly bvar: NodeTypes['Identifier'],
    readonly to: NodeTypes['Number'] | NodeTypes['Neg'],
    readonly approach: 'left' | 'right' | 'both',
  },
  readonly Integral: Common<'Integral'> & {
    readonly arg: Node,
    readonly bvar: NodeTypes['Identifier'],
  },
  readonly DefInt: Common<'DefiniteIntegral'> & {
    readonly arg: Node,
    readonly bvar: NodeTypes['Identifier'],
    readonly lower: Node,
    readonly upper: Node,
  },
  readonly Diff: Common<'Derivative'> & {
    readonly arg: Node,
    readonly bvar: NodeTypes['Identifier'],
    readonly degree: Node,
  },
  readonly PartialDiff: Common<'PartialDerivative'> & {
    readonly arg: Node,
    readonly bvars: readonly NodeTypes['Identifier'][],
    readonly degrees: readonly Node[],
  },
  readonly Sequence: Common<'Sequence'> & {readonly args: TwoOrMore<Node>}
  readonly Sum: Common<'Sum'> & {
    readonly arg: Node,
    readonly bvar: NodeTypes['Identifier'],
    readonly lower: Node,
    readonly upper: Node,
  },
  readonly Product: Common<'Product'> & {
    readonly arg: Node,
    readonly bvar: NodeTypes['Identifier'],
    readonly lower: Node,
    readonly upper: Node,
  },
  readonly Eq: Common<'Equals'> & {readonly args: TwoOrMore<Node>}
  readonly Neq: Common<'NotEquals'> & {readonly args: TwoOrMore<Node>}
  readonly Parens: Common<'Parens'> & {readonly arg: Node}
}

export type Node = NodeTypes[keyof NodeTypes];

export type Number = NodeTypes['Number'];
export type Identifier = NodeTypes['Identifier'];
export type Function = NodeTypes['Function'];
export type Add = NodeTypes['Add'];
export type Mul = NodeTypes['Mul'];
export type PlusMinus = NodeTypes['PlusMinus'];
export type MinusPlus = NodeTypes['MinusPlus'];
export type UnaryPlusMinus = NodeTypes['UnaryPlusMinus'];
export type UnaryMinusPlus = NodeTypes['UnaryMinusPlus'];
export type Div = NodeTypes['Div'];
export type Mod = NodeTypes['Mod'];
export type Pow = NodeTypes['Pow'];
export type Root = NodeTypes['Root'];
export type Abs = NodeTypes['Abs'];
export type Neg = NodeTypes['Neg'];
export type Sin = NodeTypes['Sin'];
export type Cos = NodeTypes['Cos'];
export type Tan = NodeTypes['Tan'];
export type Cot = NodeTypes['Cot'];
export type Sec = NodeTypes['Sec'];
export type Csc = NodeTypes['Csc'];
export type ArcSin = NodeTypes['ArcSin'];
export type ArcCos = NodeTypes['ArcCos'];
export type ArcTan = NodeTypes['ArcTan'];
export type ArcCot = NodeTypes['ArcCot'];
export type ArcSec = NodeTypes['ArcSec'];
export type ArcCsc = NodeTypes['ArcCsc'];
export type Log = NodeTypes['Log'];
export type Ln = NodeTypes['Ln'];
export type Exp = NodeTypes['Exp'];
export type Gt = NodeTypes['Gt'];
export type Gte = NodeTypes['Gte'];
export type Lt = NodeTypes['Lt'];
export type Lte = NodeTypes['Lte'];
export type Infinity = NodeTypes['Infinity'];
export type Pi = NodeTypes['Pi'];
export type E = NodeTypes['E'];
export type Ellipsis = NodeTypes['Ellipsis'];
export type And = NodeTypes['And'];
export type Or = NodeTypes['Or'];
export type Xor = NodeTypes['Xor'];
export type Not = NodeTypes['Not'];
export type Implies = NodeTypes['Implies'];
export type Equivalent = NodeTypes['Equivalent'];
export type True = NodeTypes['True'];
export type False = NodeTypes['False'];
export type Set = NodeTypes['Set'];
export type Union = NodeTypes['Union'];
export type Intersection = NodeTypes['Intersection'];
export type CartesianProduct = NodeTypes['CartesianProduct'];
export type SetDiff = NodeTypes['SetDiff'];
export type Subset = NodeTypes['Subset'];
export type ProperSubset = NodeTypes['ProperSubset'];
export type Superset = NodeTypes['Superset'];
export type ProperSuperset = NodeTypes['ProperSuperset'];
export type NotSubset = NodeTypes['NotSubset'];
export type NotProperSubset = NodeTypes['NotProperSubset'];
export type NotSuperset = NodeTypes['NotSuperset'];
export type NotProperSuperset = NodeTypes['NotProperSuperset'];
export type In = NodeTypes['In'];
export type NotIn = NodeTypes['NotIn'];
export type EmptySet = NodeTypes['EmptySet'];
export type Naturals = NodeTypes['Naturals'];
export type Integers = NodeTypes['Integers'];
export type Rationals = NodeTypes['Rationals'];
export type Reals = NodeTypes['Reals'];
export type Complexes = NodeTypes['Complexes'];
export type Matrix = NodeTypes['Matrix'];
export type Vector = NodeTypes['Vector'];
export type Determinant = NodeTypes['Determinant'];
export type Transpose = NodeTypes['Transpose'];
export type VectorProduct = NodeTypes['VectorProduct'];
export type ScalarProduct = NodeTypes['ScalarProduct'];
export type Limit = NodeTypes['Limit'];
export type Integral = NodeTypes['Integral'];
export type DefInt = NodeTypes['DefInt'];
export type Diff = NodeTypes['Diff'];
export type PartialDiff = NodeTypes['PartialDiff'];
export type Sequence = NodeTypes['Sequence'];
export type Sum = NodeTypes['Sum'];
export type Product = NodeTypes['Product'];
export type Eq = NodeTypes['Eq'];
export type Neq = NodeTypes['Neq'];
export type Parens = NodeTypes['Parens'];
export type NumericRelation =
  | NodeTypes['Eq']
  | NodeTypes['Neq']
  | NodeTypes['Lt']
  | NodeTypes['Lte']
  | NodeTypes['Gt']
  | NodeTypes['Gte'];
export type NumRelType = NumericRelation['type'];