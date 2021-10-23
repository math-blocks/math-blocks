import { traverseNode } from '../../char/transforms';
import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';
import type { CharNode } from '../../char/types';

export const moveRight = (state: State): State => {
  const { selection, row, selecting } = state;

  if (
    !selecting &&
    (!PathUtils.equals(selection.anchor.path, selection.focus.path) ||
      selection.anchor.offset !== selection.focus.offset)
  ) {
    const { end } = SelectionUtils.getSelectionRange(selection);
    const newFocus = {
      path: selection.focus.path,
      offset: end,
    };
    return {
      ...state,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  let focusParent = null as CharNode | null;

  traverseNode(
    row,
    {
      exit: (node, path) => {
        if (PathUtils.equals(path, selection.focus.path)) {
          focusParent = node;
        }
      },
    },
    [],
  );

  if (focusParent?.type === 'row') {
    const { focus } = selection;

    if (selection.focus.offset < focusParent.children.length) {
      // There are sibling nodes to the right of selection.focus.
      const { anchor, focus } = selection;
      const nextNode = focusParent.children[focus.offset];
      // We nav into if we're not selecting or if the anchor isn't
      // a descendent of the path we're nav-ing into
      if (
        'children' in nextNode &&
        (!selecting || PathUtils.isPrefix(focus.path, anchor.path))
      ) {
        const firstChildIndex = nextNode.children.findIndex(
          (child) => child != null,
        );
        if (firstChildIndex !== -1) {
          // nav into
          const newFocus = {
            path: [...focus.path, focus.offset, firstChildIndex],
            offset: 0,
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

      // nav over
      const newFocus = {
        path: focus.path,
        offset: focus.offset + 1,
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

    // We're at the end of the row
    if (focus.path.length > 0) {
      // if there's a sibling we can navigate to...
      const parentPath = focus.path.slice(0, -1);
      const parentNode = PathUtils.getNodeAtPath(row, parentPath);
      if (parentNode && 'children' in parentNode) {
        const parentIndex = focus.path[focus.path.length - 1];
        const nextChildIndex = parentNode.children.findIndex(
          (child, index) => index > parentIndex && child,
        );

        if (nextChildIndex !== -1) {
          // nav to next child
          const newFocus = {
            path: [...parentPath, nextChildIndex],
            offset: 0,
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
        offset: grandparentIndex + 1,
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

  // do nothing
  return state;
};
