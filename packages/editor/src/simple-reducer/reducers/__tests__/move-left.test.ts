import * as b from '../../../char/builders';

import { reducer } from '../../reducer';
import type { Action, Path, Selection, State } from '../../types';

const makeSelection = (path: Path, offset: number): Selection => {
  return {
    anchor: { path, offset },
    focus: { path, offset },
  };
};

const makeSelection2 = (
  anchorPath: Path,
  anchorOffset: number,
  focusPath: Path,
  focusOffset: number,
): Selection => {
  return {
    anchor: { path: anchorPath, offset: anchorOffset },
    focus: { path: focusPath, offset: focusOffset },
  };
};

describe('moveLeft', () => {
  describe('not selecting', () => {
    it('should move over nodes that without any children', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: makeSelection([], 3),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([], 2));
    });

    it('should stop moving at the start of the outermost row', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: makeSelection([], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([], 0));
    });

    it('should move into subscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup([b.char('n')], undefined)]),
        selection: makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([1, 0], 1));
    });

    it('should move into superscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.subsup(undefined, [b.char('2')])]),
        selection: makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([1, 1], 1));
    });

    it('should move out subscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.char('x'),
          b.subsup([b.char('n')], undefined),
        ]),
        selection: makeSelection([3, 0], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([], 3));
    });

    it('should move from subscripts into superscripts', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup([b.char('n')], [b.char('2')])]),
        selection: makeSelection([1, 1], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([1, 0], 1));
    });
  });

  describe('selecting', () => {
    it('should grow the selection to the left', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: makeSelection2([], 2, [], 1),
        selecting: true,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection2([], 2, [], 0));
    });

    it('should shrink the selection to the left', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: makeSelection2([], 1, [], 3),
        selecting: true,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection2([], 1, [], 2));
    });

    it('should grow the selection to the left (anchor in child)', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.subsup(undefined, [b.char('2')]),
          b.char('+'),
          b.char('y'),
        ]),
        selection: makeSelection2([1, 1], 1, [1, 1], 0),
        selecting: true,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection2([1, 1], 1, [], 1));
    });

    it('should shrink the selection to the left (anchor in child)', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('x'),
          b.subsup(undefined, [b.char('2')]),
          b.char('+'),
          b.char('y'),
        ]),
        selection: makeSelection2([1, 1], 0, [], 2),
        selecting: true,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection2([1, 1], 0, [1, 1], 1));
    });
  });

  describe('collapsing selections', () => {
    test('left to right in same row', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: makeSelection2([], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([], 0));
    });

    test('right to left in same row', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('x'), b.char('+'), b.char('y')]),
        selection: makeSelection2([], 3, [], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([], 0));
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
        selection: makeSelection2([1, 1], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([], 1));
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
        selection: makeSelection2([1, 1], 0, [], 0),
        selecting: false,
      };
      const action: Action = { type: 'ArrowLeft' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(makeSelection([], 0));
    });
  });
});
