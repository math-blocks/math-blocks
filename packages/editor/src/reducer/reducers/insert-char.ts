import { getId } from '@math-blocks/core';

import * as builders from '../../char/builders';
import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { CharAtom } from '../../char/types';
import type { State } from '../types';

// TODO: place cursor in lower limits
const LIMIT_CHARS = [
  '\u2211', // \sum
  '\u220F', // \prod
  '\u222B', // \int
  // TODO: handle \lim (need to make sure we exclude the upper limit)
];

export const insertChar = (state: State, char: string): State => {
  const { row, selection } = state;
  const newNode = LIMIT_CHARS.includes(char)
    ? builders.limits(builders.char(char), [], [])
    : builders.char(char);

  const { start, end, path } = SelectionUtils.getPathAndRange(selection);

  let composedChar: CharAtom | null = null;
  if (start === end && end > 0) {
    const prevNode = row.children[end - 1];
    if (char === '=' && prevNode.type === 'char' && prevNode.value === '<') {
      composedChar = {
        id: getId(),
        type: 'char',
        value: '\u2264',
        style: {},
        composition: [prevNode, builders.char('=')],
      };
    } else if (
      char === '=' &&
      prevNode.type === 'char' &&
      prevNode.value === '>'
    ) {
      composedChar = {
        id: getId(),
        type: 'char',
        value: '\u2265',
        style: {},
        composition: [prevNode, builders.char('=')],
      };
    }
  }

  const newRow = PathUtils.updateRowAtPath(row, path, (node) => {
    const beforeSelection = node.children.slice(0, start);
    const afterSelection = node.children.slice(end);

    if (composedChar) {
      return {
        ...node,
        children: [
          ...beforeSelection.slice(0, -1),
          composedChar,
          ...afterSelection,
        ],
      };
    }
    return {
      ...node,
      children: [...beforeSelection, newNode, ...afterSelection],
    };
  });

  if (newRow === row) {
    console.log('row update failed');
    return state;
  }

  const newFocus = {
    path: path,
    offset: composedChar ? start : start + 1,
  };

  return {
    ...state,
    row: newRow,
    selection: { anchor: newFocus, focus: newFocus },
  };
};
