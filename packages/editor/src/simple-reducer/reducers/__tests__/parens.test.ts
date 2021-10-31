import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import { reducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

describe('frac', () => {
  describe('with selection', () => {
    it('left parens should wrap the selection in a delimited node', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection2([], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'Parens', char: '(' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.delimited(
            [b.char('x'), b.char('+'), b.char('y')],
            b.char('('),
            b.char(')'),
          ),
        ]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([0, 0], 0),
      );
    });

    it('right parens should wrap the selection in a delimited node', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection2([], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'Parens', char: ')' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.delimited(
            [b.char('x'), b.char('+'), b.char('y')],
            b.char('('),
            b.char(')'),
          ),
        ]),
      );
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 1));
    });
  });

  describe('without selection', () => {
    it('should wrap nodes to the right of a left paren inside a delimited', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Parens', char: '(' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.char('x'),
          b.delimited(
            [b.char('+'), b.char('y')],
            b.char('(', false),
            b.char(')', true),
          ),
        ]),
      );
      // cursor is inside the delimited at the start of the row
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 0], 0),
      );
    });

    it('should wrap nodes to the left of a right paren inside a delimited', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'Parens', char: ')' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.delimited(
            [b.char('x'), b.char('+')],
            b.char('(', true),
            b.char(')', false),
          ),
          b.char('y'),
        ]),
      );
      // cursor appears just after the delimited
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 1));
    });
  });

  describe('completing pending parens', () => {
    it('should complete a pending right paren', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.delimited(
            [b.char('x'), b.char('+'), b.char('y')],
            b.char('(', false),
            b.char(')', true),
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 1),
        selecting: false,
      };
      const action: Action = { type: 'Parens', char: ')' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.delimited([b.char('x')], b.char('(', false), b.char(')', false)),
          b.char('+'),
          b.char('y'),
        ]),
      );
      // cursor is to just the right of the completed delimited node
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 1));
    });

    it('should complete a pending left paren', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.delimited(
            [b.char('x'), b.char('+'), b.char('y')],
            b.char('(', true),
            b.char(')', false),
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 2),
        selecting: false,
      };
      const action: Action = { type: 'Parens', char: '(' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.char('x'),
          b.char('+'),
          b.delimited([b.char('y')], b.char('(', false), b.char(')', false)),
        ]),
      );
      // cursor is inside the delimited at the start of the row
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([2, 0], 0),
      );
    });
  });
});
