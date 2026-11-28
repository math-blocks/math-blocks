import type { State } from './types';

/**
 * An undo history of editor states. `present` is the current state, `past`
 * holds the states that undo goes back to (oldest first) and `future` holds
 * the states that redo goes forward to (next first).
 */
export type History = {
  readonly past: readonly State[];
  readonly present: State;
  readonly future: readonly State[];
};

/** The number of undo steps `push` keeps by default. */
export const DEFAULT_LIMIT = 100;

/** Creates a history with `state` as its present and nothing to undo. */
export const create = (state: State): History => ({
  past: [],
  present: state,
  future: [],
});

/**
 * Records `state` as the new present.
 *
 * When `state` has the same `row` as the present, only the cursor or the
 * selection changed, so it replaces the present instead of adding an undo
 * step, and redo stays available. Undo then puts the cursor back where it was
 * just before the edit it undoes.
 *
 * Otherwise the old present becomes an undo step and the redo steps are
 * dropped. At most `limit` undo steps are kept.
 */
export const push = (
  history: History,
  state: State,
  limit: number = DEFAULT_LIMIT,
): History => {
  if (state === history.present) {
    return history;
  }
  if (state.row === history.present.row) {
    return { ...history, present: state };
  }
  const past = [...history.past, history.present];
  return {
    past: past.length > limit ? past.slice(past.length - limit) : past,
    present: state,
    future: [],
  };
};

export const canUndo = (history: History): boolean => history.past.length > 0;

export const canRedo = (history: History): boolean => history.future.length > 0;

/**
 * Goes back one step. Returns `history` itself when there's nothing to undo.
 * The restored state keeps the present's `selecting` flag, which tracks
 * whether Shift is held rather than anything about the content.
 */
export const undo = (history: History): History => {
  const { past, present, future } = history;
  if (past.length === 0) {
    return history;
  }
  const previous = past[past.length - 1];
  return {
    past: past.slice(0, -1),
    present: { ...previous, selecting: present.selecting },
    future: [present, ...future],
  };
};

/**
 * Goes forward one step. Returns `history` itself when there's nothing to
 * redo. Like `undo`, it keeps the present's `selecting` flag.
 */
export const redo = (history: History): History => {
  const { past, present, future } = history;
  if (future.length === 0) {
    return history;
  }
  const [next, ...rest] = future;
  return {
    past: [...past, present],
    present: { ...next, selecting: present.selecting },
    future: rest,
  };
};
