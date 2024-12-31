import * as b from '../../../char/builders';

import { toEqualEditorNode } from '../../../test-util';
import * as SelectionUtils from '../../selection-utils';
import { getReducer } from '../../reducer';

import type { Action, State } from '../../types';

expect.extend({ toEqualEditorNode });

const reducer = getReducer({});

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
            [
              b.row([b.char('1')]),
              b.row([b.char('0')]),
              b.row([b.char('0')]),
              b.row([b.char('1')]),
            ],
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
            [
              b.row([b.char('1')]),
              b.row([b.char('0')]),
              b.row([b.char('0')]),
              b.row([b.char('1')]),
            ],
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
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
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
              b.row([b.char('0')]),
              b.row([b.char('0')]),
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
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
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
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
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('0')]),
              b.row([b.char('0')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
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
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
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
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
              b.row([b.char('0')]),
              b.row([b.char('0')]),
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
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
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
              b.row([b.char('0')]),
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('0')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
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
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
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
              b.row([b.char('a')]),
              b.row([b.char('0')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('0')]),
              b.row([b.char('d')]),
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
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
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
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('0')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
              b.row([b.char('0')]),
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
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteRow' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([b.row([b.char('c')]), b.row([b.char('d')])], 2, 1)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 0]);
    });

    test('deleting the last row', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 3], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteRow' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([b.row([b.char('a')]), b.row([b.char('b')])], 2, 1)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 1]);
    });
  });

  describe('DeleteColumn', () => {
    test('deleting the first column', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 0], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteColumn' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([b.row([b.char('b')]), b.row([b.char('d')])], 1, 2)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 0]);
    });

    test('deleting the last row', () => {
      const state: State = {
        row: b.row([
          b.matrix(
            [
              b.row([b.char('a')]),
              b.row([b.char('b')]),
              b.row([b.char('c')]),
              b.row([b.char('d')]),
            ],
            2,
            2,
          ),
        ]),
        selection: SelectionUtils.makeSelection([0, 3], 0),
        selecting: false,
      };

      const newState = reducer(state, { type: 'DeleteColumn' });

      expect(newState.row).toEqualEditorNode(
        b.row([b.matrix([b.row([b.char('a')]), b.row([b.char('c')])], 1, 2)]),
      );
      expect(newState.selection.focus.path).toEqual([0, 1]);
    });
  });
});
