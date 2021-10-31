import * as b from '../../../char/builders';

import { reducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';

describe('moveRight', () => {
  describe('not selecting', () => {
    it('should move over nodes that without any children', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection([], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 1));
    });

    it('should stop moving at the end of the outermost row', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection([], 3),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
    });

    it('should move into subscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup([b.char('n')], undefined)]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 0], 0),
      );
    });

    it('should move into superscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.subsup(undefined, [b.char('2')])]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 1], 0),
      );
    });

    it('should move out superscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.char('x'),
          b.subsup(undefined, [b.char('2')]),
        ]),
        selection: SelectionUtils.makeSelection([3, 1], 1),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 4));
    });

    it('should move from subscripts into superscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup([b.char('n')], [b.char('2')])]),
        selection: SelectionUtils.makeSelection([1, 0], 1),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 1], 0),
      );
    });
  });

  describe('selecting', () => {
    it('should grow the selection to the right', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection2([], 0, [], 1),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([], 0, [], 2),
      );
    });

    it('should shrink the selection to the right', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection2([], 3, [], 1),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([], 3, [], 2),
      );
    });

    it('should grow the selection to the right (anchor in child)', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.subsup(undefined, [b.char('2')]),
          b.char('+'),
          b.char('y'),
        ]),
        selection: SelectionUtils.makeSelection2([1, 1], 0, [1, 1], 1),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([1, 1], 0, [], 2),
      );
    });

    it('should shrink the selection to the right (anchor in child)', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.subsup(undefined, [b.char('2')]),
          b.char('+'),
          b.char('y'),
        ]),
        selection: SelectionUtils.makeSelection2([1, 1], 1, [], 1),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([1, 1], 1, [1, 1], 0),
      );
    });

    it('should skip over complex nodes', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('a'),
          b.char('+'),
          b.frac([b.char('b')], [b.char('c')]),
        ]),
        selection: SelectionUtils.makeSelection2([], 0, [], 2),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([], 0, [], 3),
      );
    });

    it('navigate out at the end of a numerator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('a'),
          b.char('+'),
          b.frac([b.char('b')], [b.char('c')]),
        ]),
        selection: SelectionUtils.makeSelection2([2, 0], 0, [2, 0], 1),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([2, 0], 0, [], 3),
      );
    });

    it('navigate out at the end of a denominator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('a'),
          b.char('+'),
          b.frac([b.char('b')], [b.char('c')]),
        ]),
        selection: SelectionUtils.makeSelection2([2, 1], 0, [2, 1], 1),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([2, 1], 0, [], 3),
      );
    });

    it('should move into the same child as the anchor', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('a'),
          b.char('+'),
          b.frac([b.char('b')], [b.char('c')]),
        ]),
        selection: SelectionUtils.makeSelection2([2, 1], 1, [], 2),
        selecting: true,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([2, 1], 1, [2, 1], 0),
      );
    });
  });

  describe('collapsing selections', () => {
    test('left to right in same row', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection2([], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
    });

    test('right to left in same row', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: SelectionUtils.makeSelection2([], 3, [], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
    });

    test('anchor in child, left to right', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.subsup(undefined, [b.char('2')]),
          b.char('+'),
          b.char('y'),
        ]),
        selection: SelectionUtils.makeSelection2([1, 1], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
    });

    test('anchor in child, right to left', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.subsup(undefined, [b.char('2')]),
          b.char('+'),
          b.char('y'),
        ]),
        selection: SelectionUtils.makeSelection2([1, 1], 0, [], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowRight' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
    });
  });
});
