import { getId } from '@math-blocks/core';

import * as types from '../../char/types';
import * as builders from '../../char/builders';

import * as util from '../util';
import { adjustColumns } from './adjust-columns';
import { zipperToVerticalWork, verticalWorkToZipper } from './util';

import type { State, ZTable, Zipper } from '../types';

// TODO: rename this and move into utils
const removeEmptyColumns = (zipper: Zipper): Zipper => {
  const work = zipperToVerticalWork(zipper);
  if (!work) {
    return zipper;
  }
  const adjustedWork = adjustColumns(work);
  return verticalWorkToZipper(adjustedWork);
};

export const moveDown = (state: State): State => {
  // Does it make sense if the root is not a Row?  Is this how we could prevent
  // users from exiting the table?

  const { zipper } = state;
  const { breadcrumbs } = zipper;

  if (
    breadcrumbs.length === 1 &&
    breadcrumbs[0].focus.type === 'ztable' &&
    breadcrumbs[0].focus.subtype === 'algebra'
  ) {
    const { focus } = breadcrumbs[0];

    const cellIndex = focus.left.length;
    const row = Math.floor(cellIndex / focus.colCount);

    // If we're in the bottom row of a two-row table, and the user presses
    // down, add a third row.
    if (focus.rowCount === 2 && row === 1) {
      const nodes = [...focus.left, util.zrowToRow(zipper.row), ...focus.right];
      for (let i = 0; i < focus.colCount; i++) {
        nodes.push(builders.row([]));
      }

      const left = nodes.slice(0, cellIndex + focus.colCount);
      const right = nodes.slice(cellIndex + focus.colCount + 1);

      const table: ZTable = {
        ...focus,
        rowCount: 3,
        left,
        right,
        rowStyles: [null, null, { border: 'top' }],
      };

      const newZipper: Zipper = {
        row: util.zrow(getId(), [], []),
        breadcrumbs: [
          {
            ...breadcrumbs[0],
            focus: table,
          },
        ],
      };

      // TODO: update vertical work helpers to main the row style
      return util.zipperToState(removeEmptyColumns(newZipper));
    }

    if (row < focus.rowCount - 1) {
      const work = zipperToVerticalWork(zipper);
      if (!work) {
        return state;
      }
      const col = work.columns.find((col) =>
        col.some((cell) => cell.id === work.cursorId),
      );
      if (!col) {
        throw new Error("Couldn't find the column containing the cursor");
      }
      const newCell = col[row + 1];
      const adjustedWork = adjustColumns({
        ...work,
        cursorId: newCell.id,
      });
      const newZipper: Zipper = verticalWorkToZipper(adjustedWork);
      return util.zipperToState(newZipper);
    }

    return state;
  }

  if (breadcrumbs.length > 0) {
    return state;
  }

  // TODO: figure out which cell the cursor should be in after splitting up
  // the row.
  // TODO: move this into a separate function an unit test it
  const row = util.zrowToRow(zipper.row);
  const splitRows: (types.CharRow | null)[] = [];
  let prevChildren: types.CharNode[] = [];
  let prevChild: types.CharNode | null = null;
  // Invariants:
  // - child is either directly to splitRows in its own cell (in the case of
  //   plus/minus operators) or it's added to prevChildren.
  for (const child of row.children) {
    if (child.type === 'char' && ['+', '\u2212'].includes(child.value)) {
      if (
        prevChild?.type !== 'char' ||
        !['+', '\u2212'].includes(prevChild.value)
      ) {
        if (prevChildren.length > 0) {
          splitRows.push(builders.row(prevChildren));
          prevChildren = [];
        }
        splitRows.push(builders.row([child]));
      } else {
        prevChildren.push(child);
      }
    } else if (child.type === 'char' && ['=', '>', '<'].includes(child.value)) {
      if (prevChildren.length > 0) {
        splitRows.push(builders.row(prevChildren));
        prevChildren = [];
      }
      splitRows.push(builders.row([child]));
    } else {
      prevChildren.push(child);
    }
    prevChild = child;
  }
  if (prevChildren.length > 0) {
    splitRows.push(builders.row(prevChildren));
  }

  const left = [...splitRows];
  // left.push(builders.row([])); // first cell in second table row
  const right: (types.CharRow | null)[] = [];
  // empty cells below first table row's splitRows
  for (let i = 0; i < splitRows.length; i++) {
    if (splitRows[i] == null) {
      right.push(null);
    } else {
      right.push(builders.row([]));
    }
  }

  const table: ZTable = {
    id: getId(),
    type: 'ztable',
    subtype: 'algebra',
    rowCount: 2,
    colCount: splitRows.length,
    left,
    right,
    style: {},
  };

  const newZipper: Zipper = {
    row: util.zrow(getId(), [], []),
    breadcrumbs: [
      {
        row: {
          id: getId(),
          type: 'bcrow',
          left: [],
          right: [],
          style: {},
        },
        focus: table,
      },
    ],
  };

  const finalZipper = removeEmptyColumns(newZipper);
  return util.zipperToState(finalZipper);
};

export const moveUp = (state: State): State => {
  const { zipper } = state;
  const { breadcrumbs } = zipper;

  if (
    breadcrumbs.length === 1 &&
    breadcrumbs[0].focus.type === 'ztable' &&
    breadcrumbs[0].focus.subtype === 'algebra'
  ) {
    const { focus } = breadcrumbs[0];
    const cellIndex = focus.left.length;
    const cursorRow = Math.floor(cellIndex / focus.colCount);

    const cells = [
      ...focus.left,
      util.zrowToRow(state.zipper.row),
      ...focus.right,
    ];

    if (focus.rowCount === 3 && cursorRow === 2) {
      const rowCells = cells.filter((cell, index) => {
        const row = Math.floor(index / focus.colCount);
        return row === cursorRow;
      });
      const isEmpty = rowCells.every(
        (cell) => !cell || cell.children.length === 0,
      );
      if (isEmpty) {
        const newCells = cells.slice(0, 2 * focus.colCount);
        const newCursorIndex = cellIndex - focus.colCount;

        const table: ZTable = {
          ...focus,
          rowCount: 2,
          left: newCells.slice(0, newCursorIndex),
          right: newCells.slice(newCursorIndex + 1),
          rowStyles: [null, null],
        };

        // TODO: we probably want to have two table variants: one where
        // all cells are navigable to and one where some cells can't be
        // navigated to.
        const newCursorCell = cells[newCursorIndex];

        const newZipper: Zipper = {
          row: util.zrow(
            newCursorCell?.id ?? getId(),
            [],
            newCursorCell?.children ?? [],
          ),
          breadcrumbs: [
            {
              ...breadcrumbs[0],
              focus: table,
            },
          ],
        };

        return util.zipperToState(removeEmptyColumns(newZipper));
      }
    }

    if (focus.rowCount === 2 && cursorRow === 1) {
      const rowCells = cells.filter((cell, index) => {
        const row = Math.floor(index / focus.colCount);
        return row === cursorRow;
      });
      const isEmpty = rowCells.every(
        (cell) => !cell || cell.children.length === 0,
      );
      if (isEmpty) {
        // Merge all cells into a single row
        const newCells = cells.slice(0, focus.colCount);
        const nodes = newCells.flatMap((cell) => cell?.children ?? []);

        const newZipper: Zipper = {
          // TODO: determine where to place the cursor
          row: util.zrow(getId(), [], nodes),
          breadcrumbs: [],
        };

        // We don't call removeEmptyColumns here because there is no
        // matrix at this point.
        return util.zipperToState(newZipper);
      }
    }

    if (cursorRow > 0) {
      const work = zipperToVerticalWork(zipper);
      if (!work) {
        return state;
      }
      const col = work.columns.find((col) =>
        col.some((cell) => cell.id === work.cursorId),
      );
      if (!col) {
        throw new Error("Couldn't find the column containing the cursor");
      }
      const newCell = col[cursorRow - 1];
      const adjustedWork = adjustColumns({
        ...work,
        cursorId: newCell.id,
      });
      const newZipper: Zipper = verticalWorkToZipper(adjustedWork);
      return util.zipperToState(newZipper);
    }
  }

  return state;
};
