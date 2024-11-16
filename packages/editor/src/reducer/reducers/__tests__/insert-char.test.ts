import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import { getReducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

const reducer = getReducer({});

describe('insertChar', () => {
  it('should insert the char at the right location', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('y')]),
      selection: SelectionUtils.makeSelection([], 1),
      selecting: false,
    };
    const action: Action = { type: 'InsertChar', char: '+' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([b.char('x'), b.char('+'), b.char('y')]),
    );
  });

  it("should update the cursor's position", () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('y')]),
      selection: SelectionUtils.makeSelection([], 1),
      selecting: false,
    };
    const action: Action = { type: 'InsertChar', char: '+' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
  });

  it('should replace the selection with the new char', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('y'), b.char('z')]),
      selection: SelectionUtils.makeSelection2([], 1, [], 2),
      selecting: false,
    };
    const action: Action = { type: 'InsertChar', char: '+' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([b.char('x'), b.char('+'), b.char('z')]),
    );
  });

  it("should update the cursor's position after replacing the selection", () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('y'), b.char('z')]),
      selection: SelectionUtils.makeSelection2([], 1, [], 2),
      selecting: false,
    };
    const action: Action = { type: 'InsertChar', char: '+' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
  });

  it.each`
    char
    ${'\u2211'}
    ${'\u220F'}
    ${'\u222B'}
  `('should insert limits if the char is $char', ({ char }) => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('y')]),
      selection: SelectionUtils.makeSelection([], 1),
      selecting: false,
    };
    const action: Action = { type: 'InsertChar', char: char };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([b.char('x'), b.limits(b.char(char), [], []), b.char('y')]),
    );
  });

  it('should compose < and = into ≤', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('a'), b.char('<')]),
      selection: SelectionUtils.makeSelection([], 2),
      selecting: false,
    };
    const action: Action = { type: 'InsertChar', char: '=' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row.children).toHaveLength(2);
    if (newState.row.children[1].type !== 'char') {
      throw new Error('Expected a char node');
    }
    expect(newState.row.children[1].value).toBe('\u2264');
  });

  it('should compose > and = into ≥', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('a'), b.char('>')]),
      selection: SelectionUtils.makeSelection([], 2),
      selecting: false,
    };
    const action: Action = { type: 'InsertChar', char: '=' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row.children).toHaveLength(2);
    if (newState.row.children[1].type !== 'char') {
      throw new Error('Expected a char node');
    }
    expect(newState.row.children[1].value).toBe('\u2265');
  });
});
