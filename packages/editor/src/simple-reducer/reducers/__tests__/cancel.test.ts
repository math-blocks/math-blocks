/* eslint-disable jest-dom/prefer-to-have-style */
import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import * as SelectionUtils from '../../selection-utils';
import { reducer } from '../../reducer';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

describe('cancel', () => {
  it('should cancel the selected range', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection2([], 1, [], 3),
      selecting: false,
    };
    const action: Action = { type: 'Cancel' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row.children[0].style.cancel).toBeUndefined();
    expect(newState.row.children[1].style.cancel).toEqual(expect.any(Number));
    expect(newState.row.children[2].style.cancel).toEqual(expect.any(Number));
  });

  it('should override existing cancel selections', () => {
    // Arrange
    let state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection2([], 0, [], 3),
      selecting: false,
    };
    state = reducer(state, { type: 'Cancel' });
    state = {
      ...state,
      selection: SelectionUtils.makeSelection2([], 1, [], 2),
    };

    // Act
    state = reducer(state, { type: 'Cancel' });

    // Assert
    expect(state.row.children[0].style.cancel).toEqual(expect.any(Number));
    expect(state.row.children[1].style.cancel).toEqual(expect.any(Number));
    expect(state.row.children[2].style.cancel).toEqual(expect.any(Number));
    expect(state.row.children[0].style.cancel).toEqual(
      state.row.children[2].style.cancel,
    );
    expect(state.row.children[1].style.cancel).not.toEqual(
      state.row.children[2].style.cancel,
    );
  });

  it('should uncancel', () => {
    // Arrange
    let state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection2([], 0, [], 3),
      selecting: false,
    };
    state = reducer(state, { type: 'Cancel' });
    state = {
      ...state,
      selection: SelectionUtils.makeSelection2([], 1, [], 2),
    };

    // Act
    state = reducer(state, { type: 'Uncancel' });

    // Assert
    expect(state.row.children[0].style.cancel).toEqual(expect.any(Number));
    expect(state.row.children[1].style.cancel).toBeUndefined();
    expect(state.row.children[2].style.cancel).toEqual(expect.any(Number));
  });

  it('should not cancel all descendents', () => {
    // Arrange
    const state: State = {
      row: b.row([b.frac([b.char('x')], [b.char('y')])]),
      selection: SelectionUtils.makeSelection2([], 0, [], 1),
      selecting: false,
    };
    const action: Action = { type: 'Cancel' };

    // Act
    const newState = reducer(state, action);

    // Assert
    if (newState.row.children[0].type !== 'frac') {
      throw new Error('Expected frac');
    }
    expect(newState.row.children[0].style.cancel).toEqual(expect.any(Number));
    expect(newState.row.children[0].children[0].style.cancel).toBeUndefined();
    expect(newState.row.children[0].children[1].style.cancel).toBeUndefined();
  });

  it('should not cancel anything if nothing is selected', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection([], 1),
      selecting: false,
    };
    const action: Action = { type: 'Cancel' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState).toBe(state);
  });
});
