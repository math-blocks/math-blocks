import * as b from '../../char/builders';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

export const insertChar = (state: State, char: string): State => {
  const { row, selection } = state;
  const newNode = b.char(char);

  const { start, end, path } = SelectionUtils.getPathAndRange(selection);

  const newRow = PathUtils.updateRowAtPath(row, path, (node) => {
    const beforeSelection = node.children.slice(0, start);
    const afterSelection = node.children.slice(end);
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
    offset: start + 1,
  };

  return {
    ...state,
    row: newRow,
    selection: { anchor: newFocus, focus: newFocus },
  };
};
