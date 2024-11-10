import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import { reducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

describe('backspace', () => {
  describe('deleting a char', () => {
    it('should delete the preceding char', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(b.row([b.char('x'), b.char('y')]));
    });

    it('should move the cursor to the left', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 1));
    });
  });

  describe('deleting a selection', () => {
    it('should delete the range of nodes', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.char('+'),
          b.char('y'),
          b.char('+'),
          b.char('z'),
        ]),
        selection: SelectionUtils.makeSelection2([], 4, [], 2),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('x'), b.char('+'), b.char('z')]),
      );
    });

    it('should move the cursor to where the start of the selection was', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.char('+'),
          b.char('y'),
          b.char('+'),
          b.char('z'),
        ]),
        selection: SelectionUtils.makeSelection2([], 4, [], 2),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
    });
  });

  describe('collapsing siblings', () => {
    it("should maintain the order of the collapsed node's children", () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('a'),
          b.char('+'),
          b.frac([b.char('b')], [b.char('c')]),
        ]),
        selection: SelectionUtils.makeSelection([2, 0], 0),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('a'), b.char('+'), b.char('b'), b.char('c')]),
      );
    });

    it('should move the cursor before the numerator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('a'),
          b.char('+'),
          b.frac([b.char('b')], [b.char('c')]),
        ]),
        selection: SelectionUtils.makeSelection([2, 0], 0),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
    });

    it('should move the cursor before the denominator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('a'),
          b.char('+'),
          b.frac([b.char('b')], [b.char('c')]),
        ]),
        selection: SelectionUtils.makeSelection([2, 1], 0),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
    });
  });

  describe('navigating into a complex node', () => {
    it('should move into the denominator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.frac([b.char('a')], [b.char('b')]),
          b.char('+'),
          b.char('c'),
        ]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([0, 1], 1),
      );
    });

    it('should not change the content', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.frac([b.char('a')], [b.char('b')]),
          b.char('+'),
          b.char('c'),
        ]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(state.row);
    });
  });
});
