// This file is generated by scripts/codegen.ts
// Do not edit this file directly

import type { Node } from './types';

type SourceLocation = {
  readonly path: readonly number[];
  readonly start: number;
  readonly end: number;
};

type Common<T extends string> = {
  readonly type: T;
  readonly id: number;
  readonly loc?: SourceLocation;
  source?: string; // eslint-disable-line functional/prefer-readonly-type
};

export interface NodeTypes {
  readonly Num: Common<'Number'> & {readonly value: string}
  readonly Identifier: Common<'Identifier'> & {
    readonly name: string,
    readonly subscript?: Node,
  },
  readonly Func: Common<'Func'> & {
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
  readonly Div: Common<'Div'> & {readonly args: readonly [Node, Node]}
  readonly Mod: Common<'Modulo'> & {readonly args: readonly [Node, Node]}
  readonly Pow: Common<'Power'> & {
    readonly base: Node,
    readonly exp: Node,
  },
  readonly Root: Common<'Root'> & {
    readonly index: Node,
    readonly radicand: Node,
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
    readonly to: NodeTypes['Num'] | NodeTypes['Neg'],
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
  readonly Sum: Common<'Summation'> & {
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

export type NumericRelation =
  | NodeTypes['Eq']
  | NodeTypes['Neq']
  | NodeTypes['Lt']
  | NodeTypes['Lte']
  | NodeTypes['Gt']
  | NodeTypes['Gte'];