// This file is generated by scripts/codegen.ts
// Do not edit this file directly

/* eslint-disable no-shadow-restricted-names */

import { Node, NodeTypes } from './node-types';
import { getId } from '@math-blocks/core';

export const Num = (value: string): NodeTypes['Num'] => ({
  type: 'Number',
  id: getId(),
  value,
});
export const Identifier = (name: string, subscript?: Node): NodeTypes['Identifier'] => ({
  type: 'Identifier',
  id: getId(),
  name,
  subscript,
});
export const Func = (func: Node, args: readonly Node[]): NodeTypes['Func'] => ({
  type: 'Func',
  id: getId(),
  func,
  args,
});
export const Add = (args: TwoOrMore<Node>): NodeTypes['Add'] => ({
  type: 'Add',
  id: getId(),
  args,
});
export const Mul = (args: TwoOrMore<Node>, implicit: boolean): NodeTypes['Mul'] => ({
  type: 'Mul',
  id: getId(),
  args,
  implicit,
});
export const PlusMinus = (args: TwoOrMore<Node>): NodeTypes['PlusMinus'] => ({
  type: 'PlusMinus',
  id: getId(),
  args,
});
export const MinusPlus = (args: TwoOrMore<Node>): NodeTypes['MinusPlus'] => ({
  type: 'MinusPlus',
  id: getId(),
  args,
});
export const Div = (args: readonly [Node, Node]): NodeTypes['Div'] => ({
  type: 'Div',
  id: getId(),
  args,
});
export const Mod = (args: readonly [Node, Node]): NodeTypes['Mod'] => ({
  type: 'Modulo',
  id: getId(),
  args,
});
export const Pow = (base: Node, exp: Node): NodeTypes['Pow'] => ({
  type: 'Power',
  id: getId(),
  base,
  exp,
});
export const Root = (index: Node, radicand: Node, sqrt: boolean): NodeTypes['Root'] => ({
  type: 'Root',
  id: getId(),
  index,
  radicand,
  sqrt,
});
export const Abs = (arg: Node): NodeTypes['Abs'] => ({
  type: 'AbsoluteValue',
  id: getId(),
  arg,
});
export const Neg = (arg: Node, subtraction: boolean): NodeTypes['Neg'] => ({
  type: 'Neg',
  id: getId(),
  arg,
  subtraction,
});
export const Sin = (arg: Node): NodeTypes['Sin'] => ({
  type: 'Sin',
  id: getId(),
  arg,
});
export const Cos = (arg: Node): NodeTypes['Cos'] => ({
  type: 'Cos',
  id: getId(),
  arg,
});
export const Tan = (arg: Node): NodeTypes['Tan'] => ({
  type: 'Tan',
  id: getId(),
  arg,
});
export const Cot = (arg: Node): NodeTypes['Cot'] => ({
  type: 'Cot',
  id: getId(),
  arg,
});
export const Sec = (arg: Node): NodeTypes['Sec'] => ({
  type: 'Sec',
  id: getId(),
  arg,
});
export const Csc = (arg: Node): NodeTypes['Csc'] => ({
  type: 'Csc',
  id: getId(),
  arg,
});
export const ArcSin = (arg: Node): NodeTypes['ArcSin'] => ({
  type: 'ArcSin',
  id: getId(),
  arg,
});
export const ArcCos = (arg: Node): NodeTypes['ArcCos'] => ({
  type: 'ArcCos',
  id: getId(),
  arg,
});
export const ArcTan = (arg: Node): NodeTypes['ArcTan'] => ({
  type: 'ArcTan',
  id: getId(),
  arg,
});
export const ArcCot = (arg: Node): NodeTypes['ArcCot'] => ({
  type: 'ArcCot',
  id: getId(),
  arg,
});
export const ArcSec = (arg: Node): NodeTypes['ArcSec'] => ({
  type: 'ArcSec',
  id: getId(),
  arg,
});
export const ArcCsc = (arg: Node): NodeTypes['ArcCsc'] => ({
  type: 'ArcCsc',
  id: getId(),
  arg,
});
export const Log = (base: Node, arg: Node): NodeTypes['Log'] => ({
  type: 'Log',
  id: getId(),
  base,
  arg,
});
export const Ln = (arg: Node): NodeTypes['Ln'] => ({
  type: 'Ln',
  id: getId(),
  arg,
});
export const Exp = (arg: Node): NodeTypes['Exp'] => ({
  type: 'Exp',
  id: getId(),
  arg,
});
export const Gt = (args: TwoOrMore<Node>): NodeTypes['Gt'] => ({
  type: 'GreaterThan',
  id: getId(),
  args,
});
export const Gte = (args: TwoOrMore<Node>): NodeTypes['Gte'] => ({
  type: 'GreaterThanOrEquals',
  id: getId(),
  args,
});
export const Lt = (args: TwoOrMore<Node>): NodeTypes['Lt'] => ({
  type: 'LessThan',
  id: getId(),
  args,
});
export const Lte = (args: TwoOrMore<Node>): NodeTypes['Lte'] => ({
  type: 'LessThanOrEquals',
  id: getId(),
  args,
});
export const Infinity = (): NodeTypes['Infinity'] => ({
  type: 'Infinity',
  id: getId(),
});
export const Pi = (): NodeTypes['Pi'] => ({
  type: 'Pi',
  id: getId(),
});
export const E = (): NodeTypes['E'] => ({
  type: 'E',
  id: getId(),
});
export const And = (args: TwoOrMore<Node>): NodeTypes['And'] => ({
  type: 'LogicalAnd',
  id: getId(),
  args,
});
export const Or = (args: TwoOrMore<Node>): NodeTypes['Or'] => ({
  type: 'LogicalOr',
  id: getId(),
  args,
});
export const Xor = (args: TwoOrMore<Node>): NodeTypes['Xor'] => ({
  type: 'ExclusiveOr',
  id: getId(),
  args,
});
export const Not = (arg: Node): NodeTypes['Not'] => ({
  type: 'LogicalNot',
  id: getId(),
  arg,
});
export const Implies = (args: readonly [Node, Node]): NodeTypes['Implies'] => ({
  type: 'Conditional',
  id: getId(),
  args,
});
export const Equivalent = (args: readonly [Node, Node]): NodeTypes['Equivalent'] => ({
  type: 'Biconditional',
  id: getId(),
  args,
});
export const True = (): NodeTypes['True'] => ({
  type: 'True',
  id: getId(),
});
export const False = (): NodeTypes['False'] => ({
  type: 'False',
  id: getId(),
});
export const Set = (args: TwoOrMore<Node>): NodeTypes['Set'] => ({
  type: 'Set',
  id: getId(),
  args,
});
export const Union = (args: TwoOrMore<Node>): NodeTypes['Union'] => ({
  type: 'SetDifference',
  id: getId(),
  args,
});
export const Intersect = (args: TwoOrMore<Node>): NodeTypes['Intersect'] => ({
  type: 'SetIntersection',
  id: getId(),
  args,
});
export const CartesianProduct = (args: TwoOrMore<Node>): NodeTypes['CartesianProduct'] => ({
  type: 'CartesianProduct',
  id: getId(),
  args,
});
export const SetDiff = (args: readonly [Node, Node]): NodeTypes['SetDiff'] => ({
  type: 'SetDiff',
  id: getId(),
  args,
});
export const Subset = (args: TwoOrMore<Node>): NodeTypes['Subset'] => ({
  type: 'Subset',
  id: getId(),
  args,
});
export const ProperSubset = (args: TwoOrMore<Node>): NodeTypes['ProperSubset'] => ({
  type: 'ProperSubset',
  id: getId(),
  args,
});
export const Superset = (args: TwoOrMore<Node>): NodeTypes['Superset'] => ({
  type: 'Superset',
  id: getId(),
  args,
});
export const ProperSuperset = (args: TwoOrMore<Node>): NodeTypes['ProperSuperset'] => ({
  type: 'ProperSuperset',
  id: getId(),
  args,
});
export const NotSubset = (args: readonly [Node, Node]): NodeTypes['NotSubset'] => ({
  type: 'NotSubset',
  id: getId(),
  args,
});
export const NotProperSubset = (args: readonly [Node, Node]): NodeTypes['NotProperSubset'] => ({
  type: 'NotProperSubset',
  id: getId(),
  args,
});
export const NotSuperset = (args: readonly [Node, Node]): NodeTypes['NotSuperset'] => ({
  type: 'NotSuperset',
  id: getId(),
  args,
});
export const NotProperSuperset = (args: readonly [Node, Node]): NodeTypes['NotProperSuperset'] => ({
  type: 'NotProperSuperset',
  id: getId(),
  args,
});
export const In = (element: Node, set: Node): NodeTypes['In'] => ({
  type: 'ElementOf',
  id: getId(),
  element,
  set,
});
export const NotIn = (element: Node, set: Node): NodeTypes['NotIn'] => ({
  type: 'NotElementOf',
  id: getId(),
  element,
  set,
});
export const EmptySet = (): NodeTypes['EmptySet'] => ({
  type: 'EmptySet',
  id: getId(),
});
export const Naturals = (): NodeTypes['Naturals'] => ({
  type: 'Naturals',
  id: getId(),
});
export const Integers = (): NodeTypes['Integers'] => ({
  type: 'Integers',
  id: getId(),
});
export const Rationals = (): NodeTypes['Rationals'] => ({
  type: 'Rationals',
  id: getId(),
});
export const Reals = (): NodeTypes['Reals'] => ({
  type: 'Reals',
  id: getId(),
});
export const Complexes = (): NodeTypes['Complexes'] => ({
  type: 'Complexes',
  id: getId(),
});
export const Matrix = (args: TwoOrMore<Node>, rows: number, cols: number): NodeTypes['Matrix'] => ({
  type: 'Matrix',
  id: getId(),
  args,
  rows,
  cols,
});
export const Vector = (args: TwoOrMore<Node>, dim: number): NodeTypes['Vector'] => ({
  type: 'Vector',
  id: getId(),
  args,
  dim,
});
export const Determinant = (arg: Node): NodeTypes['Determinant'] => ({
  type: 'Determinant',
  id: getId(),
  arg,
});
export const Transpose = (arg: Node): NodeTypes['Transpose'] => ({
  type: 'Transpose',
  id: getId(),
  arg,
});
export const VectorProduct = (args: readonly [Node, Node]): NodeTypes['VectorProduct'] => ({
  type: 'VectorProduct',
  id: getId(),
  args,
});
export const ScalarProduct = (args: readonly [Node, Node]): NodeTypes['ScalarProduct'] => ({
  type: 'ScalarProduct',
  id: getId(),
  args,
});
export const Limit = (arg: Node, bvar: NodeTypes['Identifier'], to: NodeTypes['Num'], approach: 'left' | 'right' | 'both'): NodeTypes['Limit'] => ({
  type: 'Limit',
  id: getId(),
  arg,
  bvar,
  to,
  approach,
});
export const Int = (arg: Node, bvar: NodeTypes['Identifier']): NodeTypes['Int'] => ({
  type: 'Int',
  id: getId(),
  arg,
  bvar,
});
export const DefInt = (arg: Node, bvar: NodeTypes['Identifier'], lower: Node, upper: Node): NodeTypes['DefInt'] => ({
  type: 'DefInt',
  id: getId(),
  arg,
  bvar,
  lower,
  upper,
});
export const Sum = (arg: Node, bvar: NodeTypes['Identifier'], lower: Node, upper: Node): NodeTypes['Sum'] => ({
  type: 'Sum',
  id: getId(),
  arg,
  bvar,
  lower,
  upper,
});
export const Prod = (arg: Node, bvar: NodeTypes['Identifier'], lower: Node, upper: Node): NodeTypes['Prod'] => ({
  type: 'Prod',
  id: getId(),
  arg,
  bvar,
  lower,
  upper,
});
export const Eq = (args: TwoOrMore<Node>): NodeTypes['Eq'] => ({
  type: 'Equals',
  id: getId(),
  args,
});
export const Neq = (args: TwoOrMore<Node>): NodeTypes['Neq'] => ({
  type: 'NotEquals',
  id: getId(),
  args,
});
export const Parens = (arg: Node): NodeTypes['Parens'] => ({
  type: 'Parens',
  id: getId(),
  arg,
});
