import { NodeType } from './enums';
import { NodeTypes } from './node-types';

export interface Common<T extends NodeType> {
  readonly type: T;
  readonly id: number;
  readonly loc?: SourceLocation;
  // TODO: rename this to something less ambiguous
  source?: string; // eslint-disable-line functional/prefer-readonly-type
}

export type Node = NodeTypes[keyof NodeTypes];

export type NumericRelation = Eq | Neq | Lt | Gt | Lte | Gte;
export type NumRelType = NumericRelation['type'];

export type Num = NodeTypes['Num'];
export type Identifier = NodeTypes['Identifier'];
export type Add = NodeTypes['Add'];
export type Mul = NodeTypes['Mul'];
export type Neg = NodeTypes['Neg'];
export type PlusMinus = NodeTypes['PlusMinus'];
export type MinusPlus = NodeTypes['MinusPlus'];
export type Div = NodeTypes['Div'];
export type Mod = NodeTypes['Mod'];
export type Root = NodeTypes['Root'];
export type Pow = NodeTypes['Pow'];
export type Log = NodeTypes['Log'];
// type Ln = NodeTypes['Ln'];
// type Exp = NodeTypes['Exp'];
export type Func = NodeTypes['Func'];

export type Infinity = NodeTypes['Infinity'];
export type Pi = NodeTypes['Pi'];
// type E = NodeTypes['E'];
export type Ellipsis = NodeTypes['Ellipsis'];
export type Abs = NodeTypes['Abs'];
export type Parens = NodeTypes['Parens'];

export type Sum = NodeTypes['Sum'];
export type Product = NodeTypes['Product'];
export type Limit = NodeTypes['Limit'];
export type Derivative = NodeTypes['Diff'];
export type PartialDerivative = NodeTypes['PartialDiff'];

export type Integral = NodeTypes['Integral'];
export type DefInt = NodeTypes['DefInt'];

export type True = NodeTypes['True'];
export type False = NodeTypes['False'];
export type Conjunction = NodeTypes['And'];
export type Disjunction = NodeTypes['Or'];
export type Not = NodeTypes['Not'];
export type Xor = NodeTypes['Xor'];
export type Implies = NodeTypes['Implies'];
export type Iff = NodeTypes['Equivalent'];

export type Eq = NodeTypes['Eq'];
export type Neq = NodeTypes['Neq'];
export type Lt = NodeTypes['Lt'];
export type Lte = NodeTypes['Lte'];
export type Gt = NodeTypes['Gt'];
export type Gte = NodeTypes['Gte'];

export type In = NodeTypes['In'];
export type NotIn = NodeTypes['NotIn'];
export type Subset = NodeTypes['Subset'];
export type ProperSubset = NodeTypes['ProperSubset'];
export type NotSubset = NodeTypes['NotSubset'];
export type NotProperSubset = NodeTypes['NotProperSubset'];
// type Superset = NodeTypes['Superset'];
// type ProperSuperset = NodeTypes['ProperSuperset'];
// type NotSuperset = NodeTypes['NotSuperset'];
// type NotProperSuperset = NodeTypes['NotProperSuperset'];
export type Set = NodeTypes['Set'];
export type EmptySet = NodeTypes['EmptySet'];
export type Union = NodeTypes['Union'];
export type Intersection = NodeTypes['Intersection'];
export type SetDiff = NodeTypes['SetDiff'];
export type CartesianProduct = NodeTypes['CartesianProduct'];

export type Naturals = NodeTypes['Naturals'];
export type Integers = NodeTypes['Integers'];
export type Rationals = NodeTypes['Rationals'];
export type Reals = NodeTypes['Reals'];
export type Complexes = NodeTypes['Complexes'];

// type Sin = NodeTypes['Sin'];
// type Cos = NodeTypes['Cos'];
// type Tan = NodeTypes['Tan'];
// type Cot = NodeTypes['Cot'];
// type Sec = NodeTypes['Sec'];
// type Csc = NodeTypes['Csc'];
// type ArcSin = NodeTypes['ArcSin'];
// type ArcCos = NodeTypes['ArcCos'];
// type ArcTan = NodeTypes['ArcTan'];
// type ArcCot = NodeTypes['ArcCot'];
// type ArcSec = NodeTypes['ArcSec'];
// type ArcCsc = NodeTypes['ArcCsc'];

// type Vector = NodeTypes['Vector'];
// type Matrix = NodeTypes['Matrix'];
// type VectorProduct = NodeTypes['VectorProduct'];
// type ScalarProduct = NodeTypes['ScalarProduct'];
// type Determinant = NodeTypes['Determinant'];
// type Transpose = NodeTypes['Transpose'];

// TODO: dedupe with editor and parser
export interface SourceLocation {
  readonly path: readonly number[];
  readonly start: number;
  readonly end: number;
}
