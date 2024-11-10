import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import * as SelectionUtils from '../../selection-utils';
import { reducer } from '../../reducer';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

describe('matrix', () => {
  describe('InsertMatrix', () => {
    test("no selection, delimiters: 'brackets'", () => {
      const state: State = {
        row: b.row([b.char('x'), b.char('+')]),
        selection: SelectionUtils.makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'InsertMatrix', delimiters: 'brackets' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.char('x'),
          b.char('+'),
          b.matrix(
            [[b.char('1')], [b.char('0')], [b.char('0')], [b.char('1')]],
            2,
            2,
            { left: b.char('['), right: b.char(']') },
          ),
        ]),
      );
    });

    test("no selection, delimiters: 'parens'", () => {
      const state: State = {
        row: b.row([b.char('x'), b.char('+')]),
        selection: SelectionUtils.makeSelection([], 2),
        selecting: false,
      };
      const action: Action = { type: 'InsertMatrix', delimiters: 'parens' };

      // Act
      const newState = reducer(state, action);

      // Assert
      expect(newState.row).toEqualEditorNode(
        b.row([
          b.char('x'),
          b.char('+'),
          b.matrix(
            [[b.char('1')], [b.char('0')], [b.char('0')], [b.char('1')]],
            2,
            2,
            { left: b.char('('), right: b.char(')') },
          ),
        ]),
      );
    });
  });

  describe('AddRow', () => {
    test('adding a row above', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'AddRow', side: 'above' });

      expect(newState.row).toEqualEditorNode(
        b.row([
          b.matrix(
            [
              [b.char('0')],
              [b.char('0')],
              [b.char('a')],
              [b.char('b')],
              [b.char('c')],
              [b.char('d')],
            ],
            2,
            3,
          ),
        ]),
      );
      expect(newState.selection.focus.path).toEqual([0, 2]);
    });

    test('adding a row below', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'AddRow', side: 'below' });

      expect(newState.row).toEqualEditorNode(
        b.row([
          b.matrix(
            [
              [b.char('a')],
              [b.char('b')],
              [b.char('0')],
              [b.char('0')],
              [b.char('c')],
              [b.char('d')],
            ],
            2,
            3,
          ),
        ]),
      );
      expect(newState.selection.focus.path).toEqual([0, 0]);
    });

    test('adding a row below the last row', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 3], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'AddRow', side: 'below' });

      expect(newState.row).toEqualEditorNode(
        b.row([
          b.matrix(
            [
              [b.char('a')],
              [b.char('b')],
              [b.char('c')],
              [b.char('d')],
              [b.char('0')],
              [b.char('0')],
            ],
            2,
            3,
          ),
        ]),
      );
      expect(newState.selection.focus.path).toEqual([0, 3]);
    });
  });

  describe('AddColumn', () => {
    test('adding a column to the left', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'AddColumn', side: 'left' });

      expect(newState.row).toEqualEditorNode(
        b.row([
          b.matrix(
            [
              [b.char('0')],
              [b.char('a')],
              [b.char('b')],
              [b.char('0')],
              [b.char('c')],
              [b.char('d')],
            ],
            3,
            2,
          ),
        ]),
      );
      expect(newState.selection.focus.path).toEqual([0, 1]);
    });

    test('adding a column to the right', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'AddColumn', side: 'right' });

      expect(newState.row).toEqualEditorNode(
        b.row([
          b.matrix(
            [
              [b.char('a')],
              [b.char('0')],
              [b.char('b')],
              [b.char('c')],
              [b.char('0')],
              [b.char('d')],
            ],
            3,
            2,
          ),
        ]),
      );
      expect(newState.selection.focus.path).toEqual([0, 0]);
    });

    test('adding a column to the right of the last column', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 3], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'AddColumn', side: 'right' });

      expect(newState.row).toEqualEditorNode(
        b.row([
          b.matrix(
            [
              [b.char('a')],
              [b.char('b')],
              [b.char('0')],
              [b.char('c')],
              [b.char('d')],
              [b.char('0')],
            ],
            3,
            2,
          ),
        ]),
      );
      expect(newState.selection.focus.path).toEqual([0, 4]);
    });
  });

  describe('DeleteRow', () => {
    test('deleting the first row', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteRow' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([[b.char('c')], [b.char('d')]], 2, 1)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 0]);
    });

    test('deleting the last row', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 3], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteRow' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([[b.char('a')], [b.char('b')]], 2, 1)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 1]);
    });
  });

  describe('DeleteColumn', () => {
    test('deleting the first column', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteColumn' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([[b.char('b')], [b.char('d')]], 1, 2)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 0]);
    });

    test('deleting the last row', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [[b.char('a')], [b.char('b')], [b.char('c')], [b.char('d')]],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 3], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteColumn' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([[b.char('a')], [b.char('c')]], 1, 2)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 1]);
    });
  });
});
