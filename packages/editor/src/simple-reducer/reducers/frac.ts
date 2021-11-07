import * as b from '../../char/builders';
import { isOperator } from '../../char/util';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

export const frac = (state: State): State => {
  const { selection, row } = state;
  const { focus } = selection;

  if (!SelectionUtils.isCollapsed(selection)) {
    const { start, end } = SelectionUtils.getPathAndRange(selection);

    const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
      const beforeSelection = node.children.slice(0, start);
      const afterSelection = node.children.slice(end);
      const frac = b.frac(node.children.slice(start, end), []);
      return {
        ...node,
        children: [...beforeSelection, frac, ...afterSelection],
      };
    });

    if (newRow !== row) {
      const newFocus = {
        path: [...focus.path, start, 1], // moves cursor into denominator
        offset: 0,
      };

      return {
        ...state,
        row: newRow,
        selection: { anchor: newFocus, focus: newFocus },
      };
    }
  }

  let index = focus.offset - 1;
  const focusRow = PathUtils.getNodeAtPath(row, focus.path);
  while (focusRow && focusRow.type === 'row' && index >= 0) {
    const child = focusRow.children[index];

    if (child.type === 'char' && isOperator(child)) {
      break;
    }

    if (child.type === 'limits') {
      break;
    }

    index--;
  }

  index++; // correct index

  if (index !== focus.offset) {
    const start = index;
    const end = focus.offset;

    const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
      const beforeSelection = node.children.slice(0, start);
      const afterSelection = node.children.slice(end);
      const frac = b.frac(
        node.children.slice(start, end), // numerator
        [], // denonminator
      );
      return {
        ...node,
        children: [...beforeSelection, frac, ...afterSelection],
      };
    });

    if (newRow !== row) {
      const newFocus = {
        path: [...focus.path, start, 1], // moves cursor into denominator
        offset: 0,
      };

      return {
        ...state,
        row: newRow,
        selection: { anchor: newFocus, focus: newFocus },
      };
    }
  }

  return state;
};
