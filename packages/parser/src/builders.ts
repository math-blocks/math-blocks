/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import { getId } from '@math-blocks/core';
import { NodeType } from '@math-blocks/semantic';

import * as types from './types';

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
): types.Num => ({
  type: NodeType.Number,
  id: getId(),
  value: value.replace(/-/g, '\u2212'),
  loc,
});

export const ellipsis = (loc?: types.SourceLocation): types.Ellipsis => ({
  type: NodeType.Ellipsis,
  id: getId(),
  loc,
});

export const add = (
  args: TwoOrMore<types.Node>,
  loc?: types.SourceLocation,
): types.Add => ({
  type: NodeType.Add,
  id: getId(),
  args,
  loc,
});

export const mul = (
  args: TwoOrMore<types.Node>,
  implicit = false,
  loc?: types.SourceLocation,
): types.Mul => ({
  type: NodeType.Mul,
  id: getId(),
  implicit,
  args,
  loc,
});

export const eq = (
  args: TwoOrMore<types.Node>,
  loc?: types.SourceLocation,
): types.Eq => ({
  type: NodeType.Equals,
  id: getId(),
  args,
  loc,
});

export const lt = (
  args: TwoOrMore<types.Node>,
  loc?: types.SourceLocation,
): types.Lt => ({
  type: NodeType.LessThan,
  id: getId(),
  args,
  loc,
});

export const lte = (
  args: TwoOrMore<types.Node>,
  loc?: types.SourceLocation,
): types.Lte => ({
  type: NodeType.LessThanOrEquals,
  id: getId(),
  args,
  loc,
});

export const gt = (
  args: TwoOrMore<types.Node>,
  loc?: types.SourceLocation,
): types.Gt => ({
  type: NodeType.GreaterThan,
  id: getId(),
  args,
  loc,
});

export const gte = (
  args: TwoOrMore<types.Node>,
  loc?: types.SourceLocation,
): types.Gte => ({
  type: NodeType.GreaterThanOrEquals,
  id: getId(),
  args,
  loc,
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

export const plusminus = (
  arg: types.Node,
  arity: 'unary' | 'binary',
  loc?: types.SourceLocation,
): types.PlusMinus => ({
  type: NodeType.PlusMinus,
  id: getId(),
  arg,
  arity,
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

export const vector = (
  args: readonly types.Node[],
  dir: types.VectorDirection,
  loc?: types.SourceLocation,
): types.Vector => ({
  type: NodeType.Vector,
  id: getId(),
  dir,
  args,
  loc,
});
