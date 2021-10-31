import * as b from '../../char/builders';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';
export const root = (state: State, withIndex: boolean): State => {
  const { selection, row } = state;
  const { focus } = selection;

  const { start, end } = SelectionUtils.getSelectionRange(selection);

  const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
    const beforeSelection = node.children.slice(0, start);
    const afterSelection = node.children.slice(end);
    const root = b.root(withIndex ? [] : null, node.children.slice(start, end));
    return {
      ...node,
      children: [...beforeSelection, root, ...afterSelection],
    };
  });

  if (newRow !== row) {
    const newFocus = !SelectionUtils.isCollapsed(selection)
      ? {
          path: focus.path,
          offset: start + 1,
        }
      : {
          path: [...focus.path, focus.offset, 1],
          offset: 0,
        };

    return {
      ...state,
      row: newRow,
      selection: { anchor: newFocus, focus: newFocus },
    };
  }

  return state;
};
