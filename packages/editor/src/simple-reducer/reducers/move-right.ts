import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

export const moveRight = (state: State): State => {
  const { selection, row, selecting } = state;

  // Collapse selection if we aren't selecting and it hasn't
  // already been collapsed.
  if (!selecting && !SelectionUtils.isCollapsed(selection)) {
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

  const focusParent = PathUtils.getNodeAtPath(row, selection.focus.path);

  if (focusParent?.type === 'row') {
    const { focus } = selection;

    // Check if we're before the end of the current row.
    if (selection.focus.offset < focusParent.children.length) {
      const { anchor, focus } = selection;
      const nextNode = focusParent.children[focus.offset];
      const isStrictPrefix = PathUtils.isPrefix(focus.path, anchor.path);
      // We nav into if we're not selecting or if the anchor isn't
      // a descendent of the path we're nav-ing into
      if ('children' in nextNode) {
        if (!selecting) {
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
        } else if (isStrictPrefix && anchor.path.length > focus.path.length) {
          const childIndex = anchor.path[focus.path.length + 1];
          // nav into
          const newFocus = {
            path: [...focus.path, focus.offset, childIndex],
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

    // We're at the end of a row

    if (focus.path.length > 0) {
      // if there's a sibling we can navigate to...
      const parentPath = focus.path.slice(0, -1);
      const parentNode = PathUtils.getNodeAtPath(row, parentPath);
      if (parentNode && 'children' in parentNode && !selecting) {
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
