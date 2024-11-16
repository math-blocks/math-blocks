import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import { getReducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

const reducer = getReducer({});

describe('frac', () => {
  describe('without selection', () => {
    it('should insert a frac with the preceeding number becoming the numerator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('2'),
          b.char('3'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 3),
        selecting: false,
      };
      const action: Action = { type: 'Fraction' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.frac([b.char('1'), b.char('2'), b.char('3')], []),
          b.char('+'),
          b.char('x'),
        ]),
      );
    });

    it('should stop at operators', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.char('2'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 3),
        selecting: false,
      };
      const action: Action = { type: 'Fraction' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.char('1'),
          b.char('+'),
          b.frac([b.char('2')], []),
          b.char('+'),
          b.char('x'),
        ]),
      );
    });

    it('should move the cursor to be the denominator', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.char('+'), b.char('c')]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Fraction' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([0, 1], 0),
      );
    });
  });

  describe('with selection', () => {
    it('should make the selection the numerator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.char('2'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection2([], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'Fraction' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.frac([b.char('1'), b.char('+'), b.char('2')], []),
          b.char('+'),
          b.char('x'),
        ]),
      );
    });

    it('should move the cursor to be the denominator', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.char('2'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection2([], 0, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'Fraction' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([0, 1], 0),
      );
    });
  });
});
