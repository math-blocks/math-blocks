import { traverseNode } from '../../char/transforms';
import * as b from '../../char/builders';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

export const insertChar = (state: State, char: string): State => {
  const { row, selection } = state;
  const newNode = b.char(char);

  const { focus } = selection;
  const { start, end } = SelectionUtils.getSelectionRange(selection);
  const newRow = traverseNode(
    row,
    {
      exit: (node, path) => {
        if (
          PathUtils.equals(path, selection.focus.path) &&
          'children' in node
        ) {
          const beforeSelection = node.children.slice(0, start);
          const afterSelection = node.children.slice(end);
          return {
            ...node,
            children: [...beforeSelection, newNode, ...afterSelection],
          };
        }
      },
    },
    [],
  );

  if (newRow === row) {
    return state;
  }

  const newFocus = {
    path: focus.path,
    offset: start + 1,
  };

  return {
    ...state,
    row: newRow,
    selection: { anchor: newFocus, focus: newFocus },
  };
};
