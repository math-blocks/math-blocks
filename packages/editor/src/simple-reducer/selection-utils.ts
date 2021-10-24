import * as PathUtils from './path-utils';

import type { Path, Selection } from './types';

export const updateSelection = (
  selection: Selection,
  selecting: boolean,
  newFocus: {
    readonly path: Path;
    readonly offset: number;
  },
): Selection => {
  return selecting
    ? { anchor: selection.anchor, focus: newFocus }
    : // We can reuse newFocus here because all its properties are readonly
      { anchor: newFocus, focus: newFocus };
};

export const getSelectionRange = (
  selection: Selection,
): { readonly start: number; readonly end: number } => {
  const { anchor, focus } = selection;
  // invariants:
  // - selection anchor should always be within the same parent as the focus
  //   or a descendant of one of the children of said parent

  if (anchor.path.length > focus.path.length) {
    return {
      start: Math.min(focus.offset, anchor.path[focus.path.length]),
      end: Math.max(focus.offset, anchor.path[focus.path.length] + 1),
    };
  }

  return {
    start: Math.min(focus.offset, anchor.offset),
    end: Math.max(focus.offset, anchor.offset),
  };
};

export const isCollapsed = (selection: Selection): boolean => {
  return (
    PathUtils.equals(selection.anchor.path, selection.focus.path) &&
    selection.anchor.offset === selection.focus.offset
  );
};

export const makeSelection = (path: Path, offset: number): Selection => {
  return {
    anchor: { path, offset },
    focus: { path, offset },
  };
};

export const makeSelection2 = (
  anchorPath: Path,
  anchorOffset: number,
  focusPath: Path,
  focusOffset: number,
): Selection => {
  return {
    anchor: { path: anchorPath, offset: anchorOffset },
    focus: { path: focusPath, offset: focusOffset },
  };
};
