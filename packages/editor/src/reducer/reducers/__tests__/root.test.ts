import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import { reducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

describe('root', () => {
  describe('without selection', () => {
    it('should insert an empty square root', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('1'), b.char('+'), b.char('x')]),
        selection: SelectionUtils.makeSelection([], 3),
        selecting: false,
      };
      const action: Action = { type: 'Root' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('1'), b.char('+'), b.char('x'), b.root(null, [])]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([3, 1], 0),
      );
    });
  });

  describe('with selection', () => {
    it('should insert an empty square root with the selection becoming the radicand', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('1'), b.char('+'), b.char('x')]),
        selection: SelectionUtils.makeSelection2([], 2, [], 3),
        selecting: false,
      };
      const action: Action = { type: 'Root' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('1'), b.char('+'), b.root(null, [b.char('x')])]),
      );
      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
    });
  });
});
