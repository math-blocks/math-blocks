import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import { moveLeft } from './move-left';

import type { State } from '../types';

export const backspace = (state: State): State => {
  const { selection, row } = state;
  const { focus } = selection;

  const focusParent = PathUtils.getNodeAtPath(row, selection.focus.path);

  if (focusParent?.type === 'row') {
    if (!SelectionUtils.isCollapsed(selection)) {
      // Deletes the whole range.
      const { start, end } = SelectionUtils.getSelectionRange(selection);

      const newRow = PathUtils.updateRowAtPath(
        row,
        selection.focus.path,
        (node) => {
          const beforeSelection = node.children.slice(0, start);
          const afterSelection = node.children.slice(end);
          return {
            ...node,
            children: [...beforeSelection, ...afterSelection],
          };
        },
      );

      if (newRow !== row) {
        // Moves the cursor to where the start of the selection was.
        const newFocus = {
          path: focus.path,
          offset: start,
        };

        return {
          ...state,
          row: newRow,
          selection: { anchor: newFocus, focus: newFocus },
        };
      }
    } else if (focus.offset > 0) {
      const prevOffset = focus.offset - 1;
      const prevNode = focusParent.children[prevOffset];

      if (prevNode.type === 'char') {
        // Deletes the char node to the left.
        const newRow = PathUtils.updateRowAtPath(
          row,
          selection.focus.path,
          (node) => {
            const beforeSelection = node.children.slice(0, focus.offset - 1);
            const afterSelection = node.children.slice(focus.offset);
            return {
              ...node,
              children: [...beforeSelection, ...afterSelection],
            };
          },
        );

        if (newRow !== row) {
          const newFocus = {
            path: focus.path,
            offset: focus.offset - 1,
          };

          return {
            ...state,
            row: newRow,
            selection: { anchor: newFocus, focus: newFocus },
          };
        }
      } else {
        // Moves left into the node.
        return moveLeft(state);
      }
    } else if (focus.path.length > 0) {
      // Moves out and flatten children of parent node.
      const parentPath = focus.path.slice(0, -1);
      const parentNode = PathUtils.getNodeAtPath(row, parentPath);
      const parentIndex = focus.path[focus.path.length - 1];

      const grandparentIndex = focus.path[focus.path.length - 2];
      const grandparentPath = focus.path.slice(0, -2);

      let offsetAdjustment = 0;

      const newRow = PathUtils.updateRowAtPath(row, grandparentPath, (node) => {
        if (
          parentNode &&
          parentNode.type !== 'row' &&
          parentNode.type !== 'char'
        ) {
          const before = node.children.slice(0, grandparentIndex);
          const after = node.children.slice(grandparentIndex + 1);
          const middle = parentNode.children.flatMap((child, index) => {
            if (index < parentIndex && child != null) {
              offsetAdjustment += child.children.length;
            }
            return child != null ? child.children : [];
          });
          return {
            ...node,
            children: [...before, ...middle, ...after],
          };
        }
      });

      if (newRow !== row) {
        const newFocus = {
          path: grandparentPath,
          // The adjustment is so that the cursor appears to the left of
          // the node that it was to the left of before collapsing things.
          offset: grandparentIndex + offsetAdjustment,
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
