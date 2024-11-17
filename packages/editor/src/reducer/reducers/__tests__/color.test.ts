/* eslint-disable jest-dom/prefer-to-have-style */
import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import * as SelectionUtils from '../../selection-utils';
import { getReducer } from '../../reducer';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

const reducer = getReducer({});

describe('color', () => {
  it('should color the selected range', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection2([], 1, [], 3),
      selecting: false,
    };
    const action: Action = { type: 'Color', color: 'red' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row.children[0].style.color).toBeUndefined();
    expect(newState.row.children[1].style.color).toEqual('red');
    expect(newState.row.children[2].style.color).toEqual('red');
  });

  it('should override existing color', () => {
    // Arrange
    let state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection2([], 0, [], 3),
      selecting: false,
    };
    state = reducer(state, { type: 'Color', color: 'blue' });
    state = {
      ...state,
      selection: SelectionUtils.makeSelection2([], 1, [], 2),
    };

    // Act
    state = reducer(state, { type: 'Color', color: 'red' });

    // Assert
    expect(state.row.children[0].style.color).toEqual('blue');
    expect(state.row.children[1].style.color).toEqual('red');
    expect(state.row.children[2].style.color).toEqual('blue');
  });

  it('should color all descendents', () => {
    // Arrange
    const state: State = {
      row: b.row([b.frac([b.char('x')], [b.char('y')])]),
      selection: SelectionUtils.makeSelection2([], 0, [], 1),
      selecting: false,
    };
    const action: Action = { type: 'Color', color: 'red' };

    // Act
    const newState = reducer(state, action);

    // Assert
    if (newState.row.children[0].type !== 'frac') {
      throw new Error('Expected frac');
    }
    expect(newState.row.children[0].children[0].style.color).toEqual('red');
    expect(newState.row.children[0].children[1].style.color).toEqual('red');
  });

  it('should not color anything if nothing is selected', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection([], 1),
      selecting: false,
    };
    const action: Action = { type: 'Color', color: 'red' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState).toBe(state);
  });
});
