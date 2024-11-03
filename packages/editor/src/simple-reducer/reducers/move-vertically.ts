import * as PathUtils from '../path-utils';
import type { State } from '../types';
import type { Action } from '../../reducer/action-types';
import type { Path, Selection } from '../types';
import type { CharRow } from '../../char/types';

export const moveVertically = (state: State, action: Action): State => {
  const { row, selection } = state;

  const { offset, path } = selection.focus;
  const newSelection = getNewSelection(row, offset, path, action);

  if (newSelection) {
    return {
      ...state,
      selection: newSelection,
    };
  }

  return state;
};

const getNewSelection = (
  root: CharRow,
  offset: number,
  path: Path,
  action: Action,
): Selection | undefined => {
  if (path.length === 0) {
    return undefined;
  }

  const parent = PathUtils.getNodeAtPath(root, path.slice(0, -1));
  const parentOffset = path[path.length - 1];

  switch (parent?.type) {
    case 'table': {
      const rowCount = parent.rowCount;
      const colCount = parent.colCount;
      const row = Math.floor(parentOffset / colCount);
      const col = parentOffset % colCount;

      let newRow = row;
      if (action.type === 'ArrowDown') {
        newRow++;
      } else if (action.type === 'ArrowUp') {
        newRow--;
      }

      if (newRow === row || newRow < 0 || newRow >= rowCount) {
        break;
      }

      const newParentOffset = newRow * colCount + col;
      const newElement = parent.children[newParentOffset];
      const newFocus = {
        path: [...path.slice(0, -1), newParentOffset],
        offset: newElement ? Math.min(offset, newElement.children.length) : 0,
      };

      return {
        anchor: newFocus,
        focus: newFocus,
      };
    }
    case 'frac': {
      let newParentOffset = parentOffset;
      if (newParentOffset === 0 && action.type === 'ArrowDown') {
        newParentOffset = 1;
      } else if (newParentOffset === 1 && action.type === 'ArrowUp') {
        newParentOffset = 0;
      }

      if (newParentOffset === parentOffset) {
        break;
      }

      const newElement = parent.children[newParentOffset];
      const newFocus = {
        path: [...path.slice(0, -1), newParentOffset],
        offset: newElement ? Math.min(offset, newElement.children.length) : 0,
      };

      return {
        anchor: newFocus,
        focus: newFocus,
      };
    }
    case 'subsup': {
      let newParentOffset = parentOffset;
      if (newParentOffset === 1 && action.type === 'ArrowDown') {
        newParentOffset = 0;
      } else if (newParentOffset === 0 && action.type === 'ArrowUp') {
        newParentOffset = 1;
      }

      if (newParentOffset === parentOffset) {
        break;
      }

      const newElement = parent.children[newParentOffset];
      const newFocus = newElement
        ? {
            // If the sup or sub has a matching sub or sup, move the cursor to the
            // corresponding sub or sup.
            path: [...path.slice(0, -1), newParentOffset],
            offset: newElement
              ? Math.min(offset, newElement.children.length)
              : 0,
          }
        : {
            path: [...path.slice(0, -2)],
            offset:
              // If we're at the end of the sup or sub and there is no corresponding
              // sub or sup, move the cursor to appear after the subsup in the parent
              // row.
              offset === parent.children[parentOffset]!.children.length
                ? path[path.length - 2] + 1
                : path[path.length - 2],
          };

      return {
        anchor: newFocus,
        focus: newFocus,
      };
    }
    case 'limits': {
      throw new Error('Move Vertically - subsup - Not implemented');
    }
  }

  // Recurses up the tree to find a parent that can be navigated to.
  return getNewSelection(root, parentOffset, path.slice(0, -1), action);
};
