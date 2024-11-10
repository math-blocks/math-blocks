import { getId } from '@math-blocks/core';

import * as b from '../../../char/builders';
import { toEqualEditorNode } from '../../../test-util';
import { reducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';
import type { CharAtom } from '../../../char/types';

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

    it('should expanded the composed character and delete the last char in it', () => {
      // Arrange
      const composedChar: CharAtom = {
        id: getId(),
        type: 'char',
        value: '\u2264',
        style: {},
        composition: [b.char('<'), b.char('=')],
      };
      const state: State = {
        row: b.row([b.char('a'), composedChar]),
        selection: SelectionUtils.makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(b.row([b.char('a'), b.char('<')]));
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
    });
  });

  describe('deleting a delimited', () => {
    test('deleting a right pending delimiter should do nothing to the delimiter', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.delimited(
            [b.char('x'), b.char('+'), b.char('y'), b.char('+'), b.char('z')],
            b.char('('),
            b.char(')', true),
          ),
        ]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqual(state.row);
      expect(newState.selection).toEqual({
        anchor: { path: [0, 0], offset: 5 },
        focus: { path: [0, 0], offset: 5 },
      });
    });

    it('should convert a non-pending right delimiter to a pending delimiter', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.delimited(
            [b.char('x'), b.char('+'), b.char('y'), b.char('+'), b.char('z')],
            b.char('('),
            b.char(')'),
          ),
        ]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      const delimited = newState.row.children[0];
      if (delimited.type !== 'delimited') {
        throw new Error('Expected a delimited node');
      }
      expect(delimited.rightDelim.pending).toBe(true);
      expect(newState.selection).toEqual({
        anchor: { path: [0, 0], offset: 5 },
        focus: { path: [0, 0], offset: 5 },
      });
    });

    it('should move the right delimited to the end of the parent', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.delimited(
            [b.char('x'), b.char('+'), b.char('y')],
            b.char('('),
            b.char(')'),
          ),
          b.char('+'),
          b.char('z'),
        ]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row.children).toHaveLength(1);
      const delimited = newState.row.children[0];
      if (delimited.type !== 'delimited') {
        throw new Error('Expected a delimited node');
      }
      expect(delimited.rightDelim.pending).toBe(true);
      expect(newState.selection).toEqual({
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 0], offset: 3 },
      });
    });

    it('should move the right delimited to the end of the parent (nested)', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.delimited(
            [
              b.delimited(
                [b.char('x'), b.char('+'), b.char('y')],
                b.char('('),
                b.char(')'),
              ),
              b.char('+'),
              b.char('z'),
            ],
            b.char('('),
            b.char(')'),
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 1),
        selecting: false,
      };
      const action: Action = { type: 'Backspace' };

      // Act
      const newState = reducer(state, action);

      // Assert
      const expectedState: State = {
        row: b.row([
          b.delimited(
            [
              b.delimited(
                [
                  b.char('x'),
                  b.char('+'),
                  b.char('y'),
                  b.char('+'),
                  b.char('z'),
                ],
                b.char('('),
                b.char(')', true),
              ),
            ],
            b.char('('),
            b.char(')'),
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 3),
        selecting: false,
      };
      expect(newState.row).toEqualEditorNode(expectedState.row);
      expect(newState.selection).toEqual({
        anchor: { path: [0, 0, 0, 0], offset: 3 },
        focus: { path: [0, 0, 0, 0], offset: 3 },
      });
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
