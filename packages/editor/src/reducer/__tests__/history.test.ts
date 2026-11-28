import * as b from '../../char/builders';

import { getReducer } from '../reducer';
import * as HistoryUtils from '../history';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

const reducer = getReducer({});

const empty: State = {
  row: b.row([]),
  selecting: false,
  selection: SelectionUtils.makeSelection([], 0),
};

const type = (
  history: HistoryUtils.History,
  chars: string,
): HistoryUtils.History =>
  [...chars].reduce(
    (h, char) =>
      HistoryUtils.push(h, reducer(h.present, { type: 'InsertChar', char })),
    history,
  );

const text = (state: State): string =>
  state.row.children
    .map((node) => (node.type === 'char' ? node.value : '?'))
    .join('');

describe('HistoryUtils', () => {
  it('starts with nothing to undo or redo', () => {
    const history = HistoryUtils.create(empty);
    expect(HistoryUtils.canUndo(history)).toBe(false);
    expect(HistoryUtils.canRedo(history)).toBe(false);
    expect(HistoryUtils.undo(history)).toBe(history);
    expect(HistoryUtils.redo(history)).toBe(history);
  });

  it('undoes and redoes each edit', () => {
    let history = type(HistoryUtils.create(empty), 'xy');
    expect(text(history.present)).toBe('xy');

    history = HistoryUtils.undo(history);
    expect(text(history.present)).toBe('x');
    expect(history.present.selection).toEqual(
      SelectionUtils.makeSelection([], 1),
    );

    history = HistoryUtils.undo(history);
    expect(text(history.present)).toBe('');
    expect(HistoryUtils.canUndo(history)).toBe(false);

    history = HistoryUtils.redo(history);
    history = HistoryUtils.redo(history);
    expect(text(history.present)).toBe('xy');
    expect(HistoryUtils.canRedo(history)).toBe(false);
  });

  it("doesn't add an undo step when only the cursor moves", () => {
    let history = type(HistoryUtils.create(empty), 'xy');
    history = HistoryUtils.push(
      history,
      reducer(history.present, { type: 'ArrowLeft' }),
    );
    expect(history.past).toHaveLength(2);
    expect(history.present.selection).toEqual(
      SelectionUtils.makeSelection([], 1),
    );
  });

  it('restores the cursor from just before the undone edit', () => {
    let history = type(HistoryUtils.create(empty), 'xy');
    history = HistoryUtils.push(
      history,
      reducer(history.present, { type: 'MoveToStart', scope: 'row' }),
    );
    history = type(history, 'a');
    expect(text(history.present)).toBe('axy');

    history = HistoryUtils.undo(history);
    expect(text(history.present)).toBe('xy');
    expect(history.present.selection).toEqual(
      SelectionUtils.makeSelection([], 0),
    );
  });

  it('keeps redo when only the cursor moves, and drops it on an edit', () => {
    let history = HistoryUtils.undo(type(HistoryUtils.create(empty), 'xy'));
    history = HistoryUtils.push(
      history,
      reducer(history.present, { type: 'ArrowLeft' }),
    );
    expect(HistoryUtils.canRedo(history)).toBe(true);

    history = type(history, 'z');
    expect(HistoryUtils.canRedo(history)).toBe(false);
  });

  it('returns the same history when pushing the present', () => {
    const history = HistoryUtils.create(empty);
    expect(HistoryUtils.push(history, history.present)).toBe(history);
  });

  it('keeps at most `limit` undo steps', () => {
    let history = HistoryUtils.create(empty);
    for (const char of 'abcde') {
      history = HistoryUtils.push(
        history,
        reducer(history.present, { type: 'InsertChar', char }),
        3,
      );
    }
    expect(history.past.map(text)).toEqual(['ab', 'abc', 'abcd']);
  });

  it("keeps the present's selecting flag on undo and redo", () => {
    let history = type(HistoryUtils.create(empty), 'x');
    history = HistoryUtils.push(history, {
      ...history.present,
      selecting: true,
    });
    history = HistoryUtils.undo(history);
    expect(history.present.selecting).toBe(true);
    history = HistoryUtils.push(history, {
      ...history.present,
      selecting: false,
    });
    history = HistoryUtils.redo(history);
    expect(history.present.selecting).toBe(false);
  });
});
