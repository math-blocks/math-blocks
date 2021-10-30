import * as b from '../../char/builders';
import { CharSubSup, CharRow } from '../../char/types';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

export const subsup = (state: State, index: 0 | 1): State => {
  const { selection, row } = state;
  const { focus } = selection;

  if (!SelectionUtils.isCollapsed(selection)) {
    // this will be similar to the 'with selection' case, but will
    // make the selection the contents of the subsup.

    // TODO: implement this
    return state;
  }

  const focusRow = PathUtils.getNodeAtPath(row, focus.path);
  if (focusRow?.type === 'row') {
    const nextNode = focusRow.children[focus.offset];
    if (nextNode?.type === 'subsup') {
      // If the next node is already a 'subsup' either move the cursor into the
      // existing superscript/subscript or create a subsuperscript/subscript of
      // it doesn't exist on the existing 'subsup' node.
      const sub: CharRow | null =
        index === 0 ? nextNode.children[0] || b.row([]) : nextNode.children[0];
      const sup: CharRow | null =
        index === 1 ? nextNode.children[1] || b.row([]) : nextNode.children[1];

      const newSubsup: CharSubSup = {
        ...nextNode,
        children: [sub, sup],
      };

      const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
        const beforeSelection = node.children.slice(0, focus.offset);
        const afterSelection = node.children.slice(focus.offset + 1);
        return {
          ...node,
          children: [...beforeSelection, newSubsup, ...afterSelection],
        };
      });

      if (newRow !== row) {
        const newFocus = {
          path: [...focus.path, focus.offset, index],
          offset: 0,
        };

        return {
          ...state,
          row: newRow,
          selection: { anchor: newFocus, focus: newFocus },
        };
      }
    } else {
      // Create a new 'subsup' node.
      const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
        const beforeSelection = node.children.slice(0, focus.offset);
        const afterSelection = node.children.slice(focus.offset);
        const subsup =
          index === 0 ? b.subsup([], undefined) : b.subsup(undefined, []);
        return {
          ...node,
          children: [...beforeSelection, subsup, ...afterSelection],
        };
      });

      if (newRow !== row) {
        const newFocus = {
          path: [...focus.path, focus.offset, index],
          offset: 0,
        };

        return {
          ...state,
          row: newRow,
          selection: { anchor: newFocus, focus: newFocus },
        };
      }
    }
  }

  return state;
};
