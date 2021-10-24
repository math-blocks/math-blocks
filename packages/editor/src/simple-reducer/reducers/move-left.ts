import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

// TODO: modify this to accept a predicate
const findPrevIndex = <T>(array: readonly T[], index: number): number => {
  for (; index > -1; index--) {
    if (array[index] != null) {
      return index;
    }
  }
  return -1;
};

const findLastIndex = <T>(array: readonly T[]): number =>
  findPrevIndex(array, array.length - 1);

export const moveLeft = (state: State): State => {
  const { selection, row, selecting } = state;

  // Collapse selection if we aren't selecting and it hasn't
  // already been collapsed.
  if (
    !selecting &&
    (!PathUtils.equals(selection.anchor.path, selection.focus.path) ||
      selection.anchor.offset !== selection.focus.offset)
  ) {
    const { start } = SelectionUtils.getSelectionRange(selection);
    const newFocus = {
      path: selection.focus.path,
      offset: start,
    };
    return {
      ...state,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  const focusParent = PathUtils.getNodeAtPath(row, selection.focus.path);

  if (focusParent?.type === 'row') {
    const { focus } = selection;

    // Check if the focus is after the start of the current row
    if (focus.offset > 0) {
      const { anchor, focus } = selection;
      const prevOffset = focus.offset - 1;
      const prevNode = focusParent.children[prevOffset];
      // We nav into if we're not selecting or if the anchor isn't
      // a descendent of the path we're nav-ing into
      if (
        'children' in prevNode &&
        (!selecting || PathUtils.isPrefix(focus.path, anchor.path))
      ) {
        const lastChildIndex = findLastIndex(prevNode.children);
        const lastChildNode = prevNode.children[lastChildIndex];
        if (lastChildNode && 'children' in lastChildNode) {
          // nav into
          const newFocus = {
            path: [...focus.path, prevOffset, lastChildIndex],
            offset: lastChildNode.children.length,
          };
          newFocus; // ?
          return {
            ...state,
            selection: SelectionUtils.updateSelection(
              selection,
              selecting,
              newFocus,
            ),
          };
        }
      }

      // nav over
      const newFocus = {
        path: focus.path,
        offset: focus.offset - 1,
      };
      return {
        ...state,
        selection: SelectionUtils.updateSelection(
          selection,
          selecting,
          newFocus,
        ),
      };
    } else if (focus.offset === 0) {
      if (focus.path.length > 0) {
        // we aren't in the root
        const parentPath = focus.path.slice(0, -1);
        const parentNode = PathUtils.getNodeAtPath(row, parentPath);
        if (parentNode && 'children' in parentNode) {
          const parentIndex = focus.path[focus.path.length - 1];
          const prevChildIndex = findPrevIndex(
            parentNode.children,
            parentIndex - 1,
          );
          const prevChildNode = parentNode.children[prevChildIndex];
          if (prevChildNode && 'children' in prevChildNode) {
            // nav to prev child
            const newFocus = {
              path: [...parentPath, prevChildIndex],
              offset: prevChildNode.children.length,
            };
            return {
              ...state,
              selection: SelectionUtils.updateSelection(
                selection,
                selecting,
                newFocus,
              ),
            };
          }
        }

        // nav out to parent
        const grandparentIndex = focus.path[focus.path.length - 2];
        const grandparentPath = focus.path.slice(0, -2);
        const newFocus = {
          path: grandparentPath,
          offset: grandparentIndex,
        };
        return {
          ...state,
          selection: SelectionUtils.updateSelection(
            selection,
            selecting,
            newFocus,
          ),
        };
      }
    } else {
      // throw an error since we can't have negative offsets
    }
  }

  // do nothing
  return state;
};
