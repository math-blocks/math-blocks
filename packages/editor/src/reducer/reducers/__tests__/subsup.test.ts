import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import { getReducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

const reducer = getReducer({});

describe('subsup', () => {
  describe('without selection', () => {
    it('should insert a superscript after the cursor', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a')]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Superscript' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('a'), b.subsup(undefined, [])]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 1], 0),
      );
    });

    it('should insert a subscript after the cursor', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a')]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Subscript' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('a'), b.subsup([], undefined)]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 0], 0),
      );
    });

    it('should add a superscript to an existing subscript', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup([b.char('n')], undefined)]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Superscript' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('a'), b.subsup([b.char('n')], [])]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 1], 0),
      );
    });

    it('should add a subscript to an existing superscript', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup(undefined, [b.char('2')])]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Subscript' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('a'), b.subsup([], [b.char('2')])]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 0], 0),
      );
    });

    it('should move into an existing subscript', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup([b.char('n')], undefined)]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Subscript' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('a'), b.subsup([b.char('n')], undefined)]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 0], 0),
      );
    });

    it('should move into an existing superscript', () => {
      // Arrange
      const state: State = {
        row: b.row([b.char('a'), b.subsup(undefined, [b.char('2')])]),
        selection: SelectionUtils.makeSelection([], 1),
        selecting: false,
      };
      const action: Action = { type: 'Superscript' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([b.char('a'), b.subsup(undefined, [b.char('2')])]),
      );
      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([1, 1], 0),
      );
    });
  });

  describe('with selection', () => {
    // TODO: write tests once this behavioe is implemented
  });
});
