import { getId } from '@math-blocks/core';

import * as types from './types';
import { NodeType, AccentType } from '../shared-types';

export function row(children: readonly types.CharNode[]): types.CharRow {
  return {
    id: getId(),
    type: NodeType.Row,
    children,
    style: {},
  };
}

export function subsup(
  sub?: readonly types.CharNode[],
  sup?: readonly types.CharNode[],
): types.CharSubSup {
  return {
    id: getId(),
    type: NodeType.SubSup,
    children: [sub ? row(sub) : null, sup ? row(sup) : null],
    style: {},
  };
}

export function limits(
  inner: types.CharNode,
  lower: readonly types.CharNode[],
  upper?: readonly types.CharNode[],
): types.CharLimits {
  return {
    id: getId(),
    type: NodeType.Limits,
    inner,
    children: [row(lower), upper ? row(upper) : null],
    style: {},
  };
}

export function frac(
  numerator: readonly types.CharNode[],
  denominator: readonly types.CharNode[],
): types.CharFrac {
  return {
    id: getId(),
    type: NodeType.Frac,
    children: [row(numerator), row(denominator)],
    style: {},
  };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root(
  index: readonly types.CharNode[] | null,
  radicand: readonly types.CharNode[],
): types.CharRoot {
  return {
    id: getId(),
    type: NodeType.Root,
    children: [index ? row(index) : null, row(radicand)],
    style: {},
  };
}

export function delimited(
  inner: readonly types.CharNode[],
  leftDelim: types.CharAtom,
  rightDelim: types.CharAtom,
): types.CharDelimited {
  return {
    id: getId(),
    type: NodeType.Delimited,
    children: [row(inner)],
    leftDelim: leftDelim,
    rightDelim: rightDelim,
    style: {},
  };
}

export function accent(
  arg: readonly types.CharNode[],
  accent: AccentType,
): types.CharAccent {
  return {
    id: getId(),
    type: NodeType.Accent,
    accent,
    wide: false,
    children: [row(arg)],
    style: {},
  };
}

export function macro(inner: readonly types.CharNode[]): types.CharMacro {
  return {
    id: getId(),
    type: NodeType.Macro,
    children: [row(inner)],
    style: {},
  };
}

export function table(
  cells: readonly (readonly types.CharRow[] | null)[],
  colCount: number,
  rowCount: number,
  delimiters?: {
    readonly left: types.CharAtom;
    readonly right: types.CharAtom;
  },
): types.CharTable {
  return {
    id: getId(),
    type: NodeType.Table,
    children: cells.map((cell) => cell && row(cell)),
    colCount,
    rowCount,
    rowStyles: undefined,
    colStyles: undefined,
    delimiters,
    style: {},
  };
}

export function matrix(
  cells: readonly (readonly types.CharRow[] | null)[],
  colCount: number,
  rowCount: number,
  delimiters?: {
    readonly left: types.CharAtom;
    readonly right: types.CharAtom;
  },
): types.CharTable {
  return table(cells, colCount, rowCount, delimiters);
}

export function atom(value: types.Char): types.CharAtom {
  return {
    ...value,
    id: getId(),
    style: {},
  };
}

export const char = (char: string, pending?: boolean): types.CharAtom =>
  atom({ type: 'char', value: char, pending });
