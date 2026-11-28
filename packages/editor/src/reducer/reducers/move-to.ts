import * as SelectionUtils from '../selection-utils';
import * as PathUtils from '../path-utils';

import type { MoveScope, State } from '../types';

const getRowLength = (state: State, path: readonly number[]): number => {
  const node = PathUtils.getNodeAtPath(state.row, path);
  return node?.type === 'row' ? node.children.length : 0;
};

const moveFocusTo = (
  state: State,
  path: readonly number[],
  offset: number,
  extend: boolean,
): State => {
  const selection = SelectionUtils.updateSelection(
    state.selection,
    extend || state.selecting,
    { path, offset },
  );
  return { ...state, selection };
};

/**
 * Moves the cursor to the start of the row it's in (`scope: 'row'`), or to the
 * start of the whole formula (`scope: 'formula'`).
 */
export const moveToStart = (
  state: State,
  scope: MoveScope,
  extend: boolean,
): State => {
  const path = scope === 'row' ? state.selection.focus.path : [];
  return moveFocusTo(state, path, 0, extend);
};

/**
 * Moves the cursor to the end of the row it's in (`scope: 'row'`), or to the
 * end of the whole formula (`scope: 'formula'`).
 */
export const moveToEnd = (
  state: State,
  scope: MoveScope,
  extend: boolean,
): State => {
  const path = scope === 'row' ? state.selection.focus.path : [];
  return moveFocusTo(state, path, getRowLength(state, path), extend);
};

/**
 * Moves the cursor out of the row it's in, to just after (`'forward'`) or just
 * before (`'backward'`) the node that contains that row. Returns `state`
 * itself when the cursor is already in the top-level row, so callers can tell
 * that nothing happened.
 */
export const exitRow = (
  state: State,
  direction: 'forward' | 'backward',
): State => {
  const { path } = state.selection.focus;
  if (path.length < 2) {
    return state;
  }
  // The focus path ends with [indexOfNodeInParentRow, indexOfRowInNode].
  const parentRowPath = path.slice(0, -2);
  const nodeIndex = path[path.length - 2];
  const offset = direction === 'forward' ? nodeIndex + 1 : nodeIndex;
  return {
    ...state,
    selection: SelectionUtils.makeSelection(parentRowPath, offset),
  };
};

/** Selects the whole formula. */
export const selectAll = (state: State): State => {
  return {
    ...state,
    selection: SelectionUtils.makeSelection2(
      [],
      0,
      [],
      state.row.children.length,
    ),
  };
};
