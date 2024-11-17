import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import { getReducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';
import { AccentType } from '../../../shared-types';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

const reducer = getReducer({
  pi: '\u03C0',
  vec: '\u20D7',
});

describe('#startMacro', () => {
  it('backslash should insert an empty macro', () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('+')]),
      selection: SelectionUtils.makeSelection([], 2),
      selecting: false,
    };
    const action: Action = { type: 'Backslash' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([b.char('x'), b.char('+'), b.macro([])]),
    );
  });
});

describe('#completeMacro', () => {
  it('space should complete a valid macro', () => {
    // Arrange
    const state: State = {
      row: b.row([
        b.char('x'),
        b.char('+'),
        b.macro([b.char('p'), b.char('i')]),
      ]),
      selection: SelectionUtils.makeSelection([2, 0], 2),
      selecting: false,
    };
    const action: Action = { type: 'Space' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([b.char('x'), b.char('+'), b.char('\u03C0')]),
    );
  });

  it('should not complete an non-existant macro', () => {
    // Arrange
    const state: State = {
      row: b.row([
        b.char('x'),
        b.char('+'),
        b.macro([b.char('f'), b.char('o'), b.char('o')]),
      ]),
      selection: SelectionUtils.makeSelection([2, 0], 3),
      selecting: false,
    };
    const action: Action = { type: 'Space' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([
        b.char('x'),
        b.char('+'),
        b.macro([b.char('f'), b.char('o'), b.char('o')]),
      ]),
    );
  });

  it("should do nothing if the cursor isn't inside a macro", () => {
    // Arrange
    const state: State = {
      row: b.row([b.char('x'), b.char('+'), b.char('y')]),
      selection: SelectionUtils.makeSelection([], 3),
      selecting: false,
    };
    const action: Action = { type: 'Space' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([b.char('x'), b.char('+'), b.char('y')]),
    );
  });

  it('space should complete a valid accent macro', () => {
    // Arrange
    const state: State = {
      row: b.row([
        b.char('x'),
        b.char('+'),
        b.macro([b.char('v'), b.char('e'), b.char('c')]),
      ]),
      selection: SelectionUtils.makeSelection([2, 0], 2),
      selecting: false,
    };
    const action: Action = { type: 'Space' };

    // Act
    const newState = reducer(state, action);

    // Assert
    expect(newState.row).toEqualEditorNode(
      b.row([b.char('x'), b.char('+'), b.accent([], AccentType.Vec)]),
    );
    expect(newState.selection).toEqual({
      anchor: { path: [2, 0], offset: 0 },
      focus: { path: [2, 0], offset: 0 },
    });
  });
});
