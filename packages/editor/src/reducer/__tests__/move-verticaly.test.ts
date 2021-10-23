import * as builders from '../../char/builders';

import { moveLeft } from '../move-left';
import { moveRight } from '../move-right';
import { moveVertically } from '../move-vertically';
import { toEqualEditorNodes, zrow } from '../test-util';
import { zipperToState } from '../util';

import type { Zipper } from '../types';

expect.extend({ toEqualEditorNodes });

describe('moveVertically', () => {
  const smallTable = builders.matrix(
    [
      [builders.char('a')],
      [builders.char('b')],
      [builders.char('c')],
      [builders.char('d')],
    ],
    2,
    2,
  );

  const largeTable = builders.matrix(
    [
      [builders.char('a')],
      [builders.char('b')],
      null,
      null,
      [builders.char('c')],
      [builders.char('d')],
    ],
    2,
    3,
  );

  test('moving down', () => {
    const zipper: Zipper = {
      row: zrow([], [smallTable]),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveRight(state);
    state = moveVertically(state, { type: 'ArrowDown' });

    expect(state.zipper.row.right).toEqualEditorNodes([builders.char('c')]);
  });

  test('moving down stops at the bottom', () => {
    const zipper: Zipper = {
      row: zrow([], [smallTable]),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveRight(state);
    state = moveVertically(state, { type: 'ArrowDown' });
    const newState = moveVertically(state, { type: 'ArrowDown' });

    expect(newState).toEqual(state);
  });

  // TODO: fix this test once we support nulls appearing in tables
  test.skip('moving down skips over null cells', () => {
    const zipper: Zipper = {
      row: zrow([], [largeTable]),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveRight(state);
    state = moveVertically(state, { type: 'ArrowDown' });

    expect(state.zipper.row.right).toEqualEditorNodes([builders.char('c')]);
  });

  test('moving down when selecting does nothing', () => {
    const zipper: Zipper = {
      row: zrow([], [smallTable]),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveRight(state);
    state = moveVertically(
      { ...state, selecting: true },
      { type: 'ArrowDown' },
    );

    expect(state.zipper.row.right).toEqualEditorNodes([builders.char('a')]);
  });

  test('moving up', () => {
    const zipper: Zipper = {
      row: zrow([smallTable], []),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveLeft(state);
    state = moveVertically(state, { type: 'ArrowUp' });

    expect(state.zipper.row.left).toEqualEditorNodes([builders.char('b')]);
  });

  test('moving up stops at the top', () => {
    const zipper: Zipper = {
      row: zrow([smallTable], []),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveLeft(state);
    state = moveVertically(state, { type: 'ArrowUp' });
    const newState = moveVertically(state, { type: 'ArrowUp' });

    expect(newState).toEqual(state);
  });

  // TODO: fix this test once we support nulls appearing in tables
  test.skip('moving up skips over null cells', () => {
    const zipper: Zipper = {
      row: zrow([largeTable], []),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveLeft(state);
    state = moveVertically(state, { type: 'ArrowUp' });

    expect(state.zipper.row.left).toEqualEditorNodes([builders.char('b')]);
  });

  test('moving up when selecting does nothing', () => {
    const zipper: Zipper = {
      row: zrow(
        [
          builders.matrix(
            [
              [builders.char('a')],
              [builders.char('b')],
              [builders.char('c')],
              [builders.char('d')],
            ],
            2,
            2,
          ),
        ],
        [],
      ),
      breadcrumbs: [],
    };
    let state = zipperToState(zipper);
    state = moveLeft(state);
    state = moveVertically({ ...state, selecting: true }, { type: 'ArrowUp' });

    expect(state.zipper.row.left).toEqualEditorNodes([builders.char('b')]);
  });

  test('ignores non-table nodes', () => {
    const zipper: Zipper = {
      row: zrow([], [builders.char('a')]),
      breadcrumbs: [],
    };
    const state = zipperToState(zipper);
    const newState = moveVertically(state, { type: 'ArrowUp' });

    expect(newState).toEqual(state);
  });
});
