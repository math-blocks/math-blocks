import * as b from '../../../char/builders';

import { reducer } from '../../reducer';
import * as SelectionUtils from '../../selection-utils';

import type { Action, Intersection, State } from '../../types';

describe('set-selection', () => {
  describe('click to move cursor', () => {
    it('should move the cursor to the left of a node', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('2'),
          b.char('3'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 0),
        selecting: false,
      };

      const intersections: Intersection[] = [];
      intersections.push({
        type: 'content',
        id: state.row.children[2].id,
        side: 'left',
      });

      const action: Action = {
        type: 'UpdateSelection',
        intersections: intersections,
        selecting: false,
      };

      const newState = reducer(state, action);

      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 2));
    });

    it('should move the cursor to the right of a node', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('2'),
          b.char('3'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 0),
        selecting: false,
      };

      const intersections: Intersection[] = [];
      intersections.push({
        type: 'content',
        id: state.row.children[2].id,
        side: 'right',
      });

      const action: Action = {
        type: 'UpdateSelection',
        intersections: intersections,
        selecting: false,
      };

      const newState = reducer(state, action);

      expect(newState.selection).toEqual(SelectionUtils.makeSelection([], 3));
    });

    it('should move the cursor to the left of a node with padding', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.frac([b.char('2')], [b.char('3')]),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 0),
        selecting: false,
      };

      const intersections: Intersection[] = [];
      intersections.push({
        type: 'content',
        id: state.row.children[2].id,
        side: 'left',
      });

      intersections.push({
        type: 'content',
        // @ts-expect-error: we know that the fraction has children
        id: state.row.children[2].children[0].id,
        side: 'left',
      });

      intersections.push({
        type: 'padding',
        flag: 'start', // TODO: make this more consistent
      });

      const action: Action = {
        type: 'UpdateSelection',
        intersections: intersections,
        selecting: false,
      };

      const newState = reducer(state, action);

      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([2, 0], 0),
      );
    });

    it('should move the cursor to the right of a node with padding', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.frac([b.char('2')], [b.char('3')]),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 0),
        selecting: false,
      };

      const intersections: Intersection[] = [];
      intersections.push({
        type: 'content',
        id: state.row.children[2].id,
        side: 'left',
      });

      intersections.push({
        type: 'content',
        // @ts-expect-error: we know that the fraction has children
        id: state.row.children[2].children[0].id,
        side: 'left',
      });

      intersections.push({
        type: 'padding',
        flag: 'end', // TODO: make this more consistent
      });

      const action: Action = {
        type: 'UpdateSelection',
        intersections: intersections,
        selecting: false,
      };

      const newState = reducer(state, action);

      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection([2, 0], 1),
      );
    });
  });

  describe('drag to selection', () => {
    it('should not include the clast node if the cursor is left of center of it', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('2'),
          b.char('3'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 0),
        selecting: false,
      };

      const intersections: Intersection[] = [];
      intersections.push({
        type: 'content',
        id: state.row.children[2].id,
        side: 'left',
      });

      const action: Action = {
        type: 'UpdateSelection',
        intersections: intersections,
        selecting: true,
      };

      const newState = reducer(state, action);

      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([], 0, [], 2),
      );
    });

    it('should include the last node should if the cursor is right of center of it', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('2'),
          b.char('3'),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([], 0),
        selecting: false,
      };

      const intersections: Intersection[] = [];
      intersections.push({
        type: 'content',
        id: state.row.children[2].id,
        side: 'right',
      });

      const action: Action = {
        type: 'UpdateSelection',
        intersections: intersections,
        selecting: true,
      };

      const newState = reducer(state, action);

      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([], 0, [], 3),
      );
    });

    it('should select nodes when dragging into padding', () => {
      // Arrange
      const state: State = {
        row: b.row([
          b.char('1'),
          b.char('+'),
          b.frac([b.char('2')], [b.char('3')]),
          b.char('+'),
          b.char('x'),
        ]),
        selection: SelectionUtils.makeSelection([2, 0], 0), // cursor left of numerator
        selecting: false,
      };

      const intersections: Intersection[] = [];
      intersections.push({
        type: 'content',
        id: state.row.children[2].id,
        side: 'left',
      });

      intersections.push({
        type: 'content',
        // @ts-expect-error: we know that the fraction has children
        id: state.row.children[2].children[0].id,
        side: 'left',
      });

      intersections.push({
        type: 'padding',
        flag: 'end', // TODO: make the Intersection type more consistent
      });

      const action: Action = {
        type: 'UpdateSelection',
        intersections: intersections,
        selecting: true,
      };

      const newState = reducer(state, action);

      expect(newState.selection).toEqual(
        SelectionUtils.makeSelection2([2, 0], 0, [2, 0], 1),
      );
    });
  });

  it('should return the original state if intersections is empty', () => {
    // Arrange
    const state: State = {
      row: b.row([
        b.char('1'),
        b.char('2'),
        b.char('3'),
        b.char('+'),
        b.char('x'),
      ]),
      selection: SelectionUtils.makeSelection([], 0),
      selecting: false,
    };

    const intersections: Intersection[] = [];

    const action: Action = {
      type: 'UpdateSelection',
      intersections: intersections,
      selecting: false,
    };

    const newState = reducer(state, action);

    expect(newState).toBe(state);
  });
});
