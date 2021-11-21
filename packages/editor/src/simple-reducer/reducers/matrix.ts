import type { Mutable } from 'utility-types';

import * as t from '../../char/types';
import * as b from '../../char/builders';
import { NodeType } from '../../shared-types';

import * as SelectionUtils from '../selection-utils';

import type { State, Path, Action } from '../types';

const nodesForPath = (root: t.CharRow, path: Path): t.CharNode[] => {
  let node: t.CharNode = root;
  const result: t.CharNode[] = [];
  for (const index of path) {
    if ('children' in node) {
      const nextNode: t.CharNode | null = node.children[index];
      if (!nextNode) {
        throw new Error('invalid path for root');
      }
      node = nextNode;
      result.push(node);
    } else {
      throw new Error('invalid path for root');
    }
  }
  return result;
};

const replaceElement = <T>(
  at: number,
  inArray: readonly T[],
  withElement: T,
): readonly T[] => {
  return [...inArray.slice(0, at), withElement, ...inArray.slice(at + 1)];
};

type Cell = {
  readonly row: number;
  readonly col: number;
  readonly content: t.CharRow | null;
};

const getCellsFromTable = (table: t.CharTable): Cell[] => {
  const cells: Cell[] = [];
  const { colCount, children } = table;

  let index = 0;
  for (let i = 0; i < children.length; i++) {
    const col = index % colCount;
    const row = Math.floor(index / colCount);
    cells[index++] = {
      row,
      col,
      content: children[i],
    };
  }

  return cells;
};

const getChildrenFromCells = (
  cells: readonly Cell[],
  colCount: number,
): t.CharTable['children'] => {
  const children: (t.CharRow | null)[] = [];

  for (const cell of cells) {
    const { row, col, content } = cell;
    const index = row * colCount + col;

    children[index] = content;
  }

  return children;
};

export const matrix = (state: State, action: Action): State => {
  if (action.type === 'InsertMatrix') {
    // TODO: implement this
    return state;
  }

  const { path } = state.selection.focus;
  const nodes = nodesForPath(state.row, path);
  const matrixPathIndex = nodes.findIndex(
    (node) => node.type === NodeType.Table && node.subtype === 'matrix',
  );

  if (matrixPathIndex === -1) {
    return state;
  }

  const matrix = nodes[matrixPathIndex] as t.CharTable;
  const cellPathIndex = matrixPathIndex + 1;
  const cellIndex = path[cellPathIndex];
  const cursorRow = Math.floor(cellIndex / matrix.colCount);
  const cursorCol = cellIndex % matrix.colCount;

  const matrixOffset = path[matrixPathIndex];
  const matrixParentPath = path.slice(0, matrixPathIndex);
  const selection = SelectionUtils.makeSelection(
    matrixParentPath,
    matrixOffset,
  );

  if (action.type === 'AddRow') {
    const cells = getCellsFromTable(matrix) as Mutable<Cell>[];

    const row = action.side === 'above' ? cursorRow : cursorRow + 1;
    for (const cell of cells) {
      if (cell.row >= row) {
        cell.row++;
      }
    }
    for (let col = 0; col < matrix.colCount; col++) {
      cells.push({
        row: row,
        col: col,
        content: b.row([b.char('0')]),
      });
    }

    const newRoot = SelectionUtils.replaceSelection(
      state.row,
      selection,
      () => ({
        ...matrix,
        children: getChildrenFromCells(cells, matrix.colCount),
        rowCount: matrix.rowCount + 1,
      }),
    );

    if (newRoot === state.row) {
      return state;
    }

    const { focus } = state.selection;
    const newFocus = {
      path:
        action.side === 'above'
          ? replaceElement(
              cellPathIndex,
              focus.path,
              cellIndex + matrix.colCount,
            )
          : focus.path,
      offset: focus.offset,
    };

    return {
      ...state,
      row: newRoot,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  if (action.type === 'DeleteRow') {
    const cells = getCellsFromTable(matrix)
      // remove all cells in the current row
      .filter((cell) => cell.row !== cursorRow) as Mutable<Cell>[];

    for (const cell of cells) {
      if (cell.row > cursorRow) {
        // update the row number of all cells after the removed row
        cell.row--;
      }
    }

    const newRoot = SelectionUtils.replaceSelection(
      state.row,
      selection,
      () => ({
        ...matrix,
        children: getChildrenFromCells(cells, matrix.colCount),
        rowCount: matrix.rowCount - 1,
      }),
    );

    if (newRoot === state.row) {
      return state;
    }

    const { focus } = state.selection;
    const newFocus = {
      path:
        // only move the cursor if its in the last row
        cursorRow === matrix.rowCount - 1
          ? replaceElement(
              cellPathIndex,
              focus.path,
              cellIndex - matrix.colCount,
            )
          : focus.path,
      offset: focus.offset,
    };

    return {
      ...state,
      row: newRoot,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  if (action.type === 'AddColumn') {
    const cells = getCellsFromTable(matrix) as Mutable<Cell>[];

    const col = action.side === 'left' ? cursorCol : cursorCol + 1;
    for (const cell of cells) {
      if (cell.col >= col) {
        cell.col++;
      }
    }
    for (let row = 0; row < matrix.rowCount; row++) {
      cells.push({
        col: col,
        row: row,
        content: b.row([b.char('0')]),
      });
    }

    const newRoot = SelectionUtils.replaceSelection(
      state.row,
      selection,
      () => ({
        ...matrix,
        children: getChildrenFromCells(cells, matrix.colCount + 1),
        colCount: matrix.colCount + 1,
      }),
    );

    if (newRoot === state.row) {
      return state;
    }

    const { focus } = state.selection;
    const newFocus = {
      ...focus,
      path: replaceElement(
        cellPathIndex,
        focus.path,
        action.side === 'left'
          ? cellIndex + cursorRow + 1
          : cellIndex + cursorRow,
      ),
    };

    return {
      ...state,
      row: newRoot,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  if (action.type === 'DeleteColumn') {
    const cells = getCellsFromTable(matrix).filter(
      (cell) => cell.col !== cursorCol,
    ) as Mutable<Cell>[];

    for (const cell of cells) {
      if (cell.col > cursorCol) {
        cell.col--;
      }
    }

    const newRoot = SelectionUtils.replaceSelection(
      state.row,
      selection,
      () => ({
        ...matrix,
        children: getChildrenFromCells(cells, matrix.colCount - 1),
        colCount: matrix.colCount - 1,
      }),
    );

    if (newRoot === state.row) {
      return state;
    }

    const { focus } = state.selection;
    const newFocus = {
      ...focus,
      path:
        cursorCol === matrix.colCount - 1
          ? replaceElement(cellPathIndex, focus.path, cellIndex - cursorRow - 1)
          : replaceElement(cellPathIndex, focus.path, cellIndex - cursorRow),
    };

    return {
      ...state,
      row: newRoot,
      selection: {
        anchor: newFocus,
        focus: newFocus,
      },
    };
  }

  return state;
};
