// This file is generated by scripts/codegen.ts
// Do not edit this file directly

/* eslint-disable no-shadow-restricted-names */

import type { Node, NodeTypes, NumericRelation } from './types';
import { NodeType } from './enums';
import { SourceLocation } from './types';
import { getId } from '@math-blocks/core';

export const makeIdentifier = (name: string, subscript?: Node, loc?: SourceLocation): NodeTypes['Identifier'] => ({
  type: 'Identifier',
  id: getId(),
  name,
  subscript,
  loc,
});
export const makeFunc = (func: Node, args: readonly Node[], loc?: SourceLocation): NodeTypes['Func'] => ({
  type: 'Func',
  id: getId(),
  func,
  args,
  loc,
});
export const makePlusMinus = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['PlusMinus'] => ({
  type: 'PlusMinus',
  id: getId(),
  args,
  loc,
});
export const makeMinusPlus = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['MinusPlus'] => ({
  type: 'MinusPlus',
  id: getId(),
  args,
  loc,
});
export const makeDiv = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['Div'] => ({
  type: 'Div',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeMod = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['Mod'] => ({
  type: 'Modulo',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makePow = (base: Node, exp: Node, loc?: SourceLocation): NodeTypes['Pow'] => ({
  type: 'Power',
  id: getId(),
  base,
  exp,
  loc,
});
export const makeRoot = (radicand: Node, index: Node, sqrt = false, loc?: SourceLocation): NodeTypes['Root'] => ({
  type: 'Root',
  id: getId(),
  radicand,
  index,
  sqrt,
  loc,
});
export const makeAbs = (arg: Node, loc?: SourceLocation): NodeTypes['Abs'] => ({
  type: 'AbsoluteValue',
  id: getId(),
  arg,
  loc,
});
export const makeNeg = (arg: Node, subtraction = false, loc?: SourceLocation): NodeTypes['Neg'] => ({
  type: 'Neg',
  id: getId(),
  arg,
  subtraction,
  loc,
});
export const makeSin = (arg: Node, loc?: SourceLocation): NodeTypes['Sin'] => ({
  type: 'Sin',
  id: getId(),
  arg,
  loc,
});
export const makeCos = (arg: Node, loc?: SourceLocation): NodeTypes['Cos'] => ({
  type: 'Cos',
  id: getId(),
  arg,
  loc,
});
export const makeTan = (arg: Node, loc?: SourceLocation): NodeTypes['Tan'] => ({
  type: 'Tan',
  id: getId(),
  arg,
  loc,
});
export const makeCot = (arg: Node, loc?: SourceLocation): NodeTypes['Cot'] => ({
  type: 'Cot',
  id: getId(),
  arg,
  loc,
});
export const makeSec = (arg: Node, loc?: SourceLocation): NodeTypes['Sec'] => ({
  type: 'Sec',
  id: getId(),
  arg,
  loc,
});
export const makeCsc = (arg: Node, loc?: SourceLocation): NodeTypes['Csc'] => ({
  type: 'Csc',
  id: getId(),
  arg,
  loc,
});
export const makeArcSin = (arg: Node, loc?: SourceLocation): NodeTypes['ArcSin'] => ({
  type: 'ArcSin',
  id: getId(),
  arg,
  loc,
});
export const makeArcCos = (arg: Node, loc?: SourceLocation): NodeTypes['ArcCos'] => ({
  type: 'ArcCos',
  id: getId(),
  arg,
  loc,
});
export const makeArcTan = (arg: Node, loc?: SourceLocation): NodeTypes['ArcTan'] => ({
  type: 'ArcTan',
  id: getId(),
  arg,
  loc,
});
export const makeArcCot = (arg: Node, loc?: SourceLocation): NodeTypes['ArcCot'] => ({
  type: 'ArcCot',
  id: getId(),
  arg,
  loc,
});
export const makeArcSec = (arg: Node, loc?: SourceLocation): NodeTypes['ArcSec'] => ({
  type: 'ArcSec',
  id: getId(),
  arg,
  loc,
});
export const makeArcCsc = (arg: Node, loc?: SourceLocation): NodeTypes['ArcCsc'] => ({
  type: 'ArcCsc',
  id: getId(),
  arg,
  loc,
});
export const makeLog = (base: Node, arg: Node, loc?: SourceLocation): NodeTypes['Log'] => ({
  type: 'Log',
  id: getId(),
  base,
  arg,
  loc,
});
export const makeLn = (arg: Node, loc?: SourceLocation): NodeTypes['Ln'] => ({
  type: 'Ln',
  id: getId(),
  arg,
  loc,
});
export const makeExp = (arg: Node, loc?: SourceLocation): NodeTypes['Exp'] => ({
  type: 'Exp',
  id: getId(),
  arg,
  loc,
});
export const makeGt = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Gt'] => ({
  type: 'GreaterThan',
  id: getId(),
  args,
  loc,
});
export const makeGte = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Gte'] => ({
  type: 'GreaterThanOrEquals',
  id: getId(),
  args,
  loc,
});
export const makeLt = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Lt'] => ({
  type: 'LessThan',
  id: getId(),
  args,
  loc,
});
export const makeLte = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Lte'] => ({
  type: 'LessThanOrEquals',
  id: getId(),
  args,
  loc,
});
export const makeInfinity = (loc?: SourceLocation): NodeTypes['Infinity'] => ({
  type: 'Infinity',
  id: getId(),
  loc,
});
export const makePi = (loc?: SourceLocation): NodeTypes['Pi'] => ({
  type: 'Pi',
  id: getId(),
  loc,
});
export const makeE = (loc?: SourceLocation): NodeTypes['E'] => ({
  type: 'E',
  id: getId(),
  loc,
});
export const makeEllipsis = (loc?: SourceLocation): NodeTypes['Ellipsis'] => ({
  type: 'Ellipsis',
  id: getId(),
  loc,
});
export const makeAnd = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['And'] => ({
  type: 'LogicalAnd',
  id: getId(),
  args,
  loc,
});
export const makeOr = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Or'] => ({
  type: 'LogicalOr',
  id: getId(),
  args,
  loc,
});
export const makeXor = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Xor'] => ({
  type: 'ExclusiveOr',
  id: getId(),
  args,
  loc,
});
export const makeNot = (arg: Node, loc?: SourceLocation): NodeTypes['Not'] => ({
  type: 'LogicalNot',
  id: getId(),
  arg,
  loc,
});
export const makeImplies = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['Implies'] => ({
  type: 'Conditional',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeEquivalent = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['Equivalent'] => ({
  type: 'Biconditional',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeTrue = (loc?: SourceLocation): NodeTypes['True'] => ({
  type: 'True',
  id: getId(),
  loc,
});
export const makeFalse = (loc?: SourceLocation): NodeTypes['False'] => ({
  type: 'False',
  id: getId(),
  loc,
});
export const makeSet = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Set'] => ({
  type: 'Set',
  id: getId(),
  args,
  loc,
});
export const makeUnion = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Union'] => ({
  type: 'Union',
  id: getId(),
  args,
  loc,
});
export const makeIntersection = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Intersection'] => ({
  type: 'SetIntersection',
  id: getId(),
  args,
  loc,
});
export const makeCartesianProduct = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['CartesianProduct'] => ({
  type: 'CartesianProduct',
  id: getId(),
  args,
  loc,
});
export const makeSetDiff = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['SetDiff'] => ({
  type: 'SetDifference',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeSubset = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Subset'] => ({
  type: 'Subset',
  id: getId(),
  args,
  loc,
});
export const makeProperSubset = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['ProperSubset'] => ({
  type: 'ProperSubset',
  id: getId(),
  args,
  loc,
});
export const makeSuperset = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Superset'] => ({
  type: 'Superset',
  id: getId(),
  args,
  loc,
});
export const makeProperSuperset = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['ProperSuperset'] => ({
  type: 'ProperSuperset',
  id: getId(),
  args,
  loc,
});
export const makeNotSubset = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['NotSubset'] => ({
  type: 'NotSubset',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeNotProperSubset = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['NotProperSubset'] => ({
  type: 'NotProperSubset',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeNotSuperset = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['NotSuperset'] => ({
  type: 'NotSuperset',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeNotProperSuperset = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['NotProperSuperset'] => ({
  type: 'NotProperSuperset',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeIn = (element: Node, set: Node, loc?: SourceLocation): NodeTypes['In'] => ({
  type: 'ElementOf',
  id: getId(),
  element,
  set,
  loc,
});
export const makeNotIn = (element: Node, set: Node, loc?: SourceLocation): NodeTypes['NotIn'] => ({
  type: 'NotElementOf',
  id: getId(),
  element,
  set,
  loc,
});
export const makeEmptySet = (loc?: SourceLocation): NodeTypes['EmptySet'] => ({
  type: 'EmptySet',
  id: getId(),
  loc,
});
export const makeNaturals = (loc?: SourceLocation): NodeTypes['Naturals'] => ({
  type: 'Naturals',
  id: getId(),
  loc,
});
export const makeIntegers = (loc?: SourceLocation): NodeTypes['Integers'] => ({
  type: 'Integers',
  id: getId(),
  loc,
});
export const makeRationals = (loc?: SourceLocation): NodeTypes['Rationals'] => ({
  type: 'Rationals',
  id: getId(),
  loc,
});
export const makeReals = (loc?: SourceLocation): NodeTypes['Reals'] => ({
  type: 'Reals',
  id: getId(),
  loc,
});
export const makeComplexes = (loc?: SourceLocation): NodeTypes['Complexes'] => ({
  type: 'Complexes',
  id: getId(),
  loc,
});
export const makeMatrix = (args: TwoOrMore<Node>, rows: number, cols: number, loc?: SourceLocation): NodeTypes['Matrix'] => ({
  type: 'Matrix',
  id: getId(),
  args,
  rows,
  cols,
  loc,
});
export const makeVector = (args: TwoOrMore<Node>, dim: number, loc?: SourceLocation): NodeTypes['Vector'] => ({
  type: 'Vector',
  id: getId(),
  args,
  dim,
  loc,
});
export const makeDeterminant = (arg: Node, loc?: SourceLocation): NodeTypes['Determinant'] => ({
  type: 'Determinant',
  id: getId(),
  arg,
  loc,
});
export const makeTranspose = (arg: Node, loc?: SourceLocation): NodeTypes['Transpose'] => ({
  type: 'Transpose',
  id: getId(),
  arg,
  loc,
});
export const makeVectorProduct = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['VectorProduct'] => ({
  type: 'VectorProduct',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeScalarProduct = (arg0: Node, arg1: Node, loc?: SourceLocation): NodeTypes['ScalarProduct'] => ({
  type: 'ScalarProduct',
  id: getId(),
  args: [arg0, arg1],
  loc,
});
export const makeLimit = (arg: Node, bvar: NodeTypes['Identifier'], to: NodeTypes['Num'] | NodeTypes['Neg'], approach: 'left' | 'right' | 'both', loc?: SourceLocation): NodeTypes['Limit'] => ({
  type: 'Limit',
  id: getId(),
  arg,
  bvar,
  to,
  approach,
  loc,
});
export const makeIntegral = (arg: Node, bvar: NodeTypes['Identifier'], loc?: SourceLocation): NodeTypes['Integral'] => ({
  type: 'Integral',
  id: getId(),
  arg,
  bvar,
  loc,
});
export const makeDefInt = (arg: Node, bvar: NodeTypes['Identifier'], lower: Node, upper: Node, loc?: SourceLocation): NodeTypes['DefInt'] => ({
  type: 'DefiniteIntegral',
  id: getId(),
  arg,
  bvar,
  lower,
  upper,
  loc,
});
export const makeDiff = (arg: Node, bvar: NodeTypes['Identifier'], degree: Node, loc?: SourceLocation): NodeTypes['Diff'] => ({
  type: 'Derivative',
  id: getId(),
  arg,
  bvar,
  degree,
  loc,
});
export const makePartialDiff = (arg: Node, bvars: readonly NodeTypes['Identifier'][], degrees: readonly Node[], loc?: SourceLocation): NodeTypes['PartialDiff'] => ({
  type: 'PartialDerivative',
  id: getId(),
  arg,
  bvars,
  degrees,
  loc,
});
export const makeSum = (arg: Node, bvar: NodeTypes['Identifier'], lower: Node, upper: Node, loc?: SourceLocation): NodeTypes['Sum'] => ({
  type: 'Summation',
  id: getId(),
  arg,
  bvar,
  lower,
  upper,
  loc,
});
export const makeProduct = (arg: Node, bvar: NodeTypes['Identifier'], lower: Node, upper: Node, loc?: SourceLocation): NodeTypes['Product'] => ({
  type: 'Product',
  id: getId(),
  arg,
  bvar,
  lower,
  upper,
  loc,
});
export const makeEq = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Eq'] => ({
  type: 'Equals',
  id: getId(),
  args,
  loc,
});
export const makeNeq = (args: TwoOrMore<Node>, loc?: SourceLocation): NodeTypes['Neq'] => ({
  type: 'NotEquals',
  id: getId(),
  args,
  loc,
});
export const makeParens = (arg: Node, loc?: SourceLocation): NodeTypes['Parens'] => ({
  type: 'Parens',
  id: getId(),
  arg,
  loc,
});

export const makeAdd = (
  terms: readonly Node[],
  loc?: SourceLocation,
): Node => {
  switch (terms.length) {
    case 0:
      return makeNum('0'); // , loc);
    case 1:
      return terms[0]; // TODO: figure out if we should give this node a location
    default:
      return {
        type: NodeType.Add,
        id: getId(),
        args: terms as TwoOrMore<Node>,
        loc,
      };
  }
};

export const makeMul = (
  factors: readonly Node[],
  implicit = false,
  loc?: SourceLocation,
): Node => {
  switch (factors.length) {
    case 0:
      return makeNum('1'); // , loc);
    case 1:
      return factors[0]; // TODO: figure out if we should give this node a location
    default:
      return {
        type: NodeType.Mul,
        id: getId(),
        implicit,
        args: factors as TwoOrMore<Node>,
        loc,
      };
  }
};

export const makeRel = (
  args: TwoOrMore<Node>,
  type: NumericRelation['type'],
  loc?: SourceLocation,
): NumericRelation => ({
  type,
  id: getId(),
  args,
});

export const makeNum = (
  value: string,
  loc?: SourceLocation,
): NodeTypes['Num'] | NodeTypes['Neg'] => {
  if (value.startsWith('-')) {
    // TODO: handle location data correctly
    return makeNeg(makeNum(value.slice(1)));
  }
  return {
    type: NodeType.Number,
    id: getId(),
    value: value.replace(/-/g, '−'),
    loc,
  };
};

export const makeSqrt = (
  radicand: Node,
  loc?: SourceLocation,
): NodeTypes['Root'] => makeRoot(makeNum('2'), radicand, true, loc);
