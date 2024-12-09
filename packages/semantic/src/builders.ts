import { getId } from '@math-blocks/core';

import * as types from './types';
import { NodeType } from './enums';

export const identifier = (
  name: string,
  loc?: types.SourceLocation,
): types.Identifier => ({
  type: NodeType.Identifier,
  id: getId(),
  name,
  loc,
});

export const number = <T extends string>(
  value: T,
  loc?: types.SourceLocation,
): types.Num | types.Neg => {
  if (value.startsWith('-')) {
    // TODO: handle location data correctly
    return neg(number(value.slice(1)));
  }
  return {
    type: NodeType.Number,
    id: getId(),
    value: value.replace(/-/g, '\u2212'),
    loc,
  };
};

export const ellipsis = (loc?: types.SourceLocation): types.Ellipsis => ({
  type: NodeType.Ellipsis,
  id: getId(),
  loc,
});

export const add = (
  terms: readonly types.Node[],
  loc?: types.SourceLocation,
): types.Node => {
  switch (terms.length) {
    case 0:
      return number('0', loc);
    case 1:
      return terms[0]; // TODO: figure out if we should give this node a location
    default:
      return {
        type: NodeType.Add,
        id: getId(),
        args: terms as TwoOrMore<types.Node>,
        loc,
      };
  }
};

export const mul = (
  factors: readonly types.Node[],
  implicit = false,
  loc?: types.SourceLocation,
): types.Node => {
  switch (factors.length) {
    case 0:
      return number('1', loc);
    case 1:
      return factors[0]; // TODO: figure out if we should give this node a location
    default:
      return {
        type: NodeType.Mul,
        id: getId(),
        implicit,
        args: factors as TwoOrMore<types.Node>,
        loc,
      };
  }
};

export const eq = (
  args: TwoOrMore<types.Node>,
  loc?: types.SourceLocation,
): types.Eq => ({
  type: NodeType.Equals,
  id: getId(),
  args,
  loc,
});

export const numRel = (
  args: TwoOrMore<types.Node>,
  type: types.NumRelType,
  loc?: types.SourceLocation,
): types.NumericRelation => ({
  type,
  id: getId(),
  args,
});

export const neg = (
  arg: types.Node,
  subtraction = false,
  loc?: types.SourceLocation,
): types.Neg => ({
  type: NodeType.Neg,
  id: getId(),
  arg,
  subtraction,
  loc,
});

export const div = (
  num: types.Node,
  den: types.Node,
  loc?: types.SourceLocation,
): types.Div => ({
  type: NodeType.Div,
  id: getId(),
  args: [num, den],
  loc,
});

export const pow = (
  base: types.Node,
  exp: types.Node,
  loc?: types.SourceLocation,
): types.Pow => ({
  type: NodeType.Power,
  id: getId(),
  base,
  exp,
  loc,
});

export const root = (
  radicand: types.Node,
  index: types.Node,
  loc?: types.SourceLocation,
): types.Root => ({
  type: NodeType.Root,
  id: getId(),
  radicand,
  index,
  sqrt: false,
  loc,
});

export const sqrt = (
  radicand: types.Node,
  loc?: types.SourceLocation,
): types.Root => ({
  type: NodeType.Root,
  id: getId(),
  radicand,
  index: number('2'),
  sqrt: true,
  loc,
});

export const parens = (
  arg: types.Node,
  loc?: types.SourceLocation,
): types.Parens => ({
  type: NodeType.Parens,
  id: getId(),
  arg,
  loc,
});
