import * as b from '../../../char/builders';

import { getReducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { State } from '../../types';

const reducer = getReducer({});

// x + 1/(a+b) with the fraction at index 2. Its numerator is [2, 0] and its
// denominator is [2, 1].
const math = b.row([
  b.char('x'),
  b.char('+'),
  b.frac([b.char('1')], [b.char('a'), b.char('+'), b.char('b')]),
  b.char('y'),
]);

const stateAt = (path: readonly number[], offset: number): State => ({
  row: math,
  selecting: false,
  selection: SelectionUtils.makeSelection(path, offset),
});

describe('MoveToStart', () => {
  it('moves to the start of the current row', () => {
    const newState = reducer(stateAt([2, 1], 2), {
      type: 'MoveToStart',
      scope: 'row',
    });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([2, 1], 0));
  });

  it('moves to the start of the whole formula', () => {
    const newState = reducer(stateAt([2, 1], 2), {
      type: 'MoveToStart',
      scope: 'formula',
    });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 0));
  });

  it('extends the selection to the start of the current row', () => {
    const newState = reducer(stateAt([2, 1], 2), {
      type: 'MoveToStart',
      scope: 'row',
      extend: true,
    });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([2, 1], 2, [2, 1], 0),
    );
    expect(newState.selecting).toBe(false);
  });

  it('extends the selection to the start of the formula', () => {
    const newState = reducer(stateAt([2, 1], 2), {
      type: 'MoveToStart',
      scope: 'formula',
      extend: true,
    });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([2, 1], 2, [], 0),
    );
    // The whole fraction and everything before it are selected.
    expect(SelectionUtils.getPathAndRange(newState.selection)).toEqual({
      path: [],
      start: 0,
      end: 3,
    });
  });

  it('extends the selection while selecting even without extend', () => {
    const newState = reducer(
      { ...stateAt([], 3), selecting: true },
      { type: 'MoveToStart', scope: 'row' },
    );
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([], 3, [], 0),
    );
  });

  it('collapses an existing selection when not extending', () => {
    const state: State = {
      ...stateAt([], 0),
      selection: SelectionUtils.makeSelection2([], 1, [], 3),
    };
    const newState = reducer(state, { type: 'MoveToStart', scope: 'row' });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 0));
  });
});

describe('MoveToEnd', () => {
  it('moves to the end of the current row', () => {
    const newState = reducer(stateAt([2, 1], 0), {
      type: 'MoveToEnd',
      scope: 'row',
    });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([2, 1], 3));
  });

  it('moves to the end of the whole formula', () => {
    const newState = reducer(stateAt([2, 0], 0), {
      type: 'MoveToEnd',
      scope: 'formula',
    });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 4));
  });

  it('extends the selection to the end of the current row', () => {
    const newState = reducer(stateAt([2, 1], 1), {
      type: 'MoveToEnd',
      scope: 'row',
      extend: true,
    });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([2, 1], 1, [2, 1], 3),
    );
  });

  it('extends the selection to the end of the formula', () => {
    const newState = reducer(stateAt([], 1), {
      type: 'MoveToEnd',
      scope: 'formula',
      extend: true,
    });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([], 1, [], 4),
    );
  });
});

describe('ExitRow', () => {
  it('moves forward out of a sub-formula, to after its node', () => {
    const newState = reducer(stateAt([2, 0], 0), {
      type: 'ExitRow',
      direction: 'forward',
    });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
  });

  it('moves backward out of a sub-formula, to before its node', () => {
    const newState = reducer(stateAt([2, 1], 3), {
      type: 'ExitRow',
      direction: 'backward',
    });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
  });

  it('moves out one level at a time', () => {
    const nested = b.row([
      b.char('x'),
      b.subsup(undefined, [b.frac([b.char('1')], [b.char('2')])]),
    ]);
    const state: State = {
      row: nested,
      selecting: false,
      selection: SelectionUtils.makeSelection([1, 1, 0, 1], 1),
    };
    const once = reducer(state, { type: 'ExitRow', direction: 'forward' });
    expect(once.selection).toEqual(SelectionUtils.makeSelection([1, 1], 1));
    const twice = reducer(once, { type: 'ExitRow', direction: 'forward' });
    expect(twice.selection).toEqual(SelectionUtils.makeSelection([], 2));
  });

  it('collapses a selection inside the sub-formula', () => {
    const state: State = {
      ...stateAt([], 0),
      selection: SelectionUtils.makeSelection2([2, 1], 0, [2, 1], 2),
    };
    const newState = reducer(state, {
      type: 'ExitRow',
      direction: 'forward',
    });
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
  });

  it('returns the same state in the top-level row', () => {
    const state = stateAt([], 1);
    expect(reducer(state, { type: 'ExitRow', direction: 'forward' })).toBe(
      state,
    );
    expect(reducer(state, { type: 'ExitRow', direction: 'backward' })).toBe(
      state,
    );
  });
});

describe('SelectAll', () => {
  it('selects the whole formula from inside a sub-formula', () => {
    const newState = reducer(stateAt([2, 1], 1), { type: 'SelectAll' });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([], 0, [], 4),
    );
    expect(newState.row).toBe(math);
  });

  it('leaves an empty formula with a collapsed selection', () => {
    const state: State = {
      row: b.row([]),
      selecting: false,
      selection: SelectionUtils.makeSelection([], 0),
    };
    const newState = reducer(state, { type: 'SelectAll' });
    expect(SelectionUtils.isCollapsed(newState.selection)).toBe(true);
  });
});

describe('ArrowLeft and ArrowRight with extend', () => {
  it('extends the selection to the right without changing selecting', () => {
    const newState = reducer(stateAt([], 1), {
      type: 'ArrowRight',
      extend: true,
    });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([], 1, [], 2),
    );
    expect(newState.selecting).toBe(false);
  });

  it('extends the selection over a fraction instead of into it', () => {
    const newState = reducer(stateAt([], 2), {
      type: 'ArrowRight',
      extend: true,
    });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([], 2, [], 3),
    );
  });

  it('extends the selection to the left', () => {
    const newState = reducer(stateAt([], 2), {
      type: 'ArrowLeft',
      extend: true,
    });
    expect(newState.selection).toEqual(
      SelectionUtils.makeSelection2([], 2, [], 1),
    );
    expect(newState.selecting).toBe(false);
  });

  it('collapses the selection without extend', () => {
    const state: State = {
      ...stateAt([], 0),
      selection: SelectionUtils.makeSelection2([], 1, [], 3),
    };
    expect(reducer(state, { type: 'ArrowLeft' }).selection).toEqual(
      SelectionUtils.makeSelection([], 1),
    );
  });
});
