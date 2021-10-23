import assert from 'assert';

import * as types from '../../char/types';

import {
  createEmptyColumn,
  getCursorLoc,
  getOtherCells,
  isColumnEmpty,
  isCellPlusMinus,
  isCellEqualSign,
  isCellEmpty,
} from './util';
import type { Column, ZVerticalWork } from './types';

const isCellOperator = (cell: types.CharRow): boolean =>
  isCellEqualSign(cell) || isCellPlusMinus(cell);

const isCellOperand = (cell: types.CharRow): boolean =>
  !isCellEmpty(cell) && !isCellOperator(cell);

const hasOperator = (cells: readonly types.CharRow[]): boolean => {
  return cells.some(isCellOperator);
};

const hasRelOperator = (cells: readonly types.CharRow[]): boolean => {
  return cells.some(isCellEqualSign);
};

const hasOperand = (cells: readonly types.CharRow[]): boolean => {
  return cells.some(isCellOperand);
};

export const adjustColumns = (work: ZVerticalWork): ZVerticalWork => {
  const { columns, colCount, rowCount } = work;
  const { cursorId, cursorIndex } = work;
  const cursorLoc = getCursorLoc(work);

  let newCursorId = cursorId;
  let newCursorIndex = cursorIndex;

  const nonEmptyColumns = columns.filter((col) => !isColumnEmpty(col));

  // Special Case: cursor is in the last row of a three-row algebra layout
  // In this situation the user shouldn't need to introduce new columns, so
  // we filter out all empty columns.  This simplifies user interactions for
  // showing vertical work correctly.
  if (rowCount === 3 && cursorLoc.row === 2) {
    // If the cursor is in an empty column, move the cursor left to the
    // first non-empty column.
    if (isColumnEmpty(columns[cursorLoc.col])) {
      for (const col of columns) {
        const cell = col[cursorLoc.row];

        if (!isColumnEmpty(col)) {
          newCursorId = cell.id;
          newCursorIndex = cell.children.length;
        }

        if (cell.id === cursorId) {
          break;
        }
      }

      if (newCursorId === cursorId) {
        for (let i = cursorLoc.col + 1; i < columns.length; i++) {
          const col = columns[i];
          if (!isColumnEmpty(col)) {
            const cell = col[cursorLoc.row];
            newCursorId = cell.id;
            newCursorIndex = 0;
            break;
          }
        }
      }
    }

    return {
      ...work,
      columns: nonEmptyColumns,
      colCount: nonEmptyColumns.length,
      cursorId: newCursorId,
      cursorIndex: newCursorIndex,
    };
  }

  const nonEmptyColumnsMap = new Map<
    Column,
    { prevEmpty: boolean; nextEmpty: boolean }
  >();
  for (let i = 0; i < colCount; i++) {
    const col = columns[i];
    if (!isColumnEmpty(col)) {
      nonEmptyColumnsMap.set(col, {
        prevEmpty: i > 0 && isColumnEmpty(columns[i - 1]),
        nextEmpty: i < colCount - 1 && isColumnEmpty(columns[i + 1]),
      });
    }
  }

  const futureNonEmptyColumns = new Map<
    Column,
    { prevEmpty: boolean; nextEmpty: boolean }
  >();

  for (let i = 0; i < nonEmptyColumns.length; i++) {
    const col = nonEmptyColumns[i];

    // skip empty columns
    if (isColumnEmpty(col)) {
      continue;
    }
    const otherCells = getOtherCells(col, col[cursorLoc.row]);

    if (otherCells.some((cell) => !isCellEmpty(cell))) {
      if (hasOperand(otherCells)) {
        futureNonEmptyColumns.set(col, {
          prevEmpty:
            i > 0 &&
            (!hasOperator(
              getOtherCells(
                nonEmptyColumns[i - 1],
                nonEmptyColumns[i - 1][cursorLoc.row],
              ),
            ) ||
              // We always put empty columns around relationship
              // operators
              hasRelOperator(
                getOtherCells(
                  nonEmptyColumns[i - 1],
                  nonEmptyColumns[i - 1][cursorLoc.row],
                ),
              )),
          nextEmpty: true,
        });
      } else if (hasOperator(otherCells)) {
        futureNonEmptyColumns.set(col, {
          prevEmpty: true,
          nextEmpty:
            i < nonEmptyColumns.length - 1 &&
            (!hasOperand(
              getOtherCells(
                nonEmptyColumns[i + 1],
                nonEmptyColumns[i + 1][cursorLoc.row],
              ),
            ) ||
              // We always put empty columns around relationship
              // operators
              hasRelOperator(otherCells)),
        });
      } else {
        // should never happen since that would imply all cells in
        // otherCells are empty
      }
    } else {
      futureNonEmptyColumns.set(col, {
        prevEmpty:
          // if some of the other cells in the previous column
          // are not empty then there should be an empty column
          // to the left
          i > 0 &&
          getOtherCells(
            nonEmptyColumns[i - 1],
            nonEmptyColumns[i - 1][cursorLoc.row],
          ).some((cell) => !isCellEmpty(cell)),

        nextEmpty:
          // if some of the other cells in the next column
          // are not empty then there should be an empty column
          // to the right
          i < nonEmptyColumns.length - 1 &&
          getOtherCells(
            nonEmptyColumns[i + 1],
            nonEmptyColumns[i + 1][cursorLoc.row],
          ).some((cell) => !isCellEmpty(cell)),
      });
    }
  }

  // Ensure there is an empty column at the beginning
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    if (futureNonEmptyColumns.has(col)) {
      const obj = futureNonEmptyColumns.get(col);
      if (obj) {
        obj.prevEmpty = true;
        break;
      }
    }
  }

  // Ensure there is an empty column at the end
  for (let i = columns.length - 1; i >= 0; i--) {
    const col = columns[i];
    if (futureNonEmptyColumns.has(col)) {
      const obj = futureNonEmptyColumns.get(col);
      if (obj) {
        obj.nextEmpty = true;
        break;
      }
    }
  }

  assert.equal(nonEmptyColumnsMap.size, futureNonEmptyColumns.size);

  let columnsAdded = false;
  let columnsRemoved = false;

  const maybeAddEmptyColumn = (emptyCol?: Column): void => {
    // This check prevents two or more empty columns in a row from being
    // included in the result.
    if (
      resultColumns.length === 0 ||
      (resultColumns.length > 0 &&
        !isColumnEmpty(resultColumns[resultColumns.length - 1]))
    ) {
      if (emptyCol) {
        resultColumns.push(emptyCol);
      } else {
        resultColumns.push(createEmptyColumn(rowCount));
        columnsAdded = true;
      }
    } else if (emptyCol) {
      // Since we didn't push the empty column that was passed to us
      // it means that it wasn't included in resultColumns and thus
      // was removed from the VerticalWork.
      columnsRemoved = true;
    }
  };

  // This removes any empty columns that aren't adjacent to a non-empty column
  // and adds in any empty columns that are required based on our rules.
  // TODO: document the rules for where empty columns should go in this file.
  const resultColumns: Column[] = [];
  for (let i = 0; i < columns.length; i++) {
    const curr = columns[i];
    if (isColumnEmpty(curr)) {
      const prev = i > 0 ? columns[i - 1] : null;
      const next = i < columns.length - 1 ? columns[i + 1] : null;
      if (prev && futureNonEmptyColumns.get(prev)?.nextEmpty) {
        maybeAddEmptyColumn(curr);
      } else if (next && futureNonEmptyColumns.get(next)?.prevEmpty) {
        maybeAddEmptyColumn(curr);
      } else {
        // If the cursor is in the current column which is being removed,
        // move it to the left or right.
        if (curr.some((cell) => cell.id === cursorId)) {
          if (prev) {
            const prevCell = prev[cursorLoc.row];
            newCursorId = prevCell.id;
            newCursorIndex = prevCell.children.length;
          } else if (next) {
            const nextCell = next[cursorLoc.row];
            newCursorId = nextCell.id;
            newCursorIndex = 0;
          }
        }
        columnsRemoved = true;
      }
    } else {
      const prev = i > 0 ? columns[i - 1] : null;
      if (
        (!isColumnEmpty(prev) || !prev) &&
        futureNonEmptyColumns.get(curr)?.prevEmpty
      ) {
        maybeAddEmptyColumn();
      }
      resultColumns.push(curr);
      const next = i < columns.length - 1 ? columns[i + 1] : null;
      if (
        (!isColumnEmpty(next) || !next) &&
        futureNonEmptyColumns.get(curr)?.nextEmpty
      ) {
        maybeAddEmptyColumn();
      }
    }
  }

  // Return the original object if no changes were made to it.
  if (!columnsAdded && !columnsRemoved) {
    return work;
  }

  const result: ZVerticalWork = {
    ...work,
    columns: resultColumns,
    colCount: resultColumns.length,
    cursorId: newCursorId,
    cursorIndex: newCursorIndex,
  };

  return result;
};
